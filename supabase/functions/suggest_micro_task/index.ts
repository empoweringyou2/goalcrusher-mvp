import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MicroTaskRequest {
  user_id: string
  available_time_minutes: number
  current_energy_level?: number // 1-10
  current_location?: 'home' | 'office' | 'commuting' | 'other'
  preferred_categories?: string[]
  avoid_categories?: string[]
  context?: string
  goal_focus?: string // goal_id to prioritize
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: MicroTaskRequest = await req.json()

    // Validate required fields
    if (!body.user_id || !body.available_time_minutes) {
      return new Response(
        JSON.stringify({ error: 'user_id and available_time_minutes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.available_time_minutes < 1 || body.available_time_minutes > 120) {
      return new Response(
        JSON.stringify({ error: 'available_time_minutes must be between 1 and 120' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user exists
    const { data: userExists, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', body.user_id)
      .single()

    if (userCheckError || !userExists) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id - user does not exist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's pending tasks that fit the time constraint
    let taskQuery = supabaseClient
      .from('tasks')
      .select('id, title, description, category, estimated_duration, priority, goal_id')
      .eq('user_id', body.user_id)
      .in('status', ['pending', 'in_progress'])
      .lte('estimated_duration', body.available_time_minutes)
      .order('priority', { ascending: false })
      .order('estimated_duration', { ascending: true })

    // Filter by preferred categories if specified
    if (body.preferred_categories && body.preferred_categories.length > 0) {
      taskQuery = taskQuery.in('category', body.preferred_categories)
    }

    const { data: existingTasks } = await taskQuery.limit(10)

    // Get user's active goals for context
    const { data: activeGoals } = await supabaseClient
      .from('goals')
      .select('id, title, priority')
      .eq('user_id', body.user_id)
      .eq('status', 'active')

    // Generate micro-task suggestions based on context
    let microTaskSuggestions = []

    // Prioritize existing tasks that fit
    if (existingTasks && existingTasks.length > 0) {
      for (const task of existingTasks.slice(0, 3)) {
        if (body.avoid_categories && body.avoid_categories.includes(task.category)) {
          continue
        }

        microTaskSuggestions.push({
          type: 'existing_task',
          task_id: task.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          category: task.category,
          priority: task.priority,
          xp_reward: Math.floor(task.estimated_duration * 1.5),
          why_suggested: 'This task fits your available time and is already on your list'
        })
      }
    }

    // Generate contextual micro-tasks based on time, energy, and location
    const contextualSuggestions = generateContextualMicroTasks(
      body.available_time_minutes,
      body.current_energy_level || 5,
      body.current_location || 'other',
      body.preferred_categories || [],
      body.avoid_categories || []
    )

    microTaskSuggestions.push(...contextualSuggestions)

    // Add goal-specific micro-tasks if goal_focus is specified
    if (body.goal_focus && activeGoals) {
      const focusGoal = activeGoals.find(g => g.id === body.goal_focus)
      if (focusGoal) {
        const goalMicroTasks = generateGoalMicroTasks(focusGoal, body.available_time_minutes)
        microTaskSuggestions.push(...goalMicroTasks)
      }
    }

    // Sort suggestions by relevance score
    microTaskSuggestions = microTaskSuggestions
      .map(suggestion => ({
        ...suggestion,
        relevance_score: calculateRelevanceScore(suggestion, body)
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5) // Top 5 suggestions

    // Log the micro-task request for learning
    const { data: requestLog } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'micro_task_request',
            available_time_minutes: body.available_time_minutes,
            current_energy_level: body.current_energy_level,
            current_location: body.current_location,
            preferred_categories: body.preferred_categories,
            context: body.context,
            suggestions_count: microTaskSuggestions.length,
            existing_tasks_available: existingTasks?.length || 0,
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single()

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'micro_task_suggestions_generated',
          resource_type: 'micro_task_request',
          resource_id: requestLog?.id,
          metadata: {
            available_time: body.available_time_minutes,
            suggestions_count: microTaskSuggestions.length,
            energy_level: body.current_energy_level,
            location: body.current_location
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        available_time_minutes: body.available_time_minutes,
        suggestions: microTaskSuggestions,
        context_analysis: {
          energy_level: body.current_energy_level || 5,
          location: body.current_location || 'other',
          time_category: body.available_time_minutes <= 5 ? 'micro' : body.available_time_minutes <= 15 ? 'short' : body.available_time_minutes <= 30 ? 'medium' : 'extended'
        },
        tips: generateProductivityTips(body.available_time_minutes, body.current_energy_level || 5),
        message: 'Micro-task suggestions generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateContextualMicroTasks(
  timeMinutes: number, 
  energyLevel: number, 
  location: string, 
  preferredCategories: string[], 
  avoidCategories: string[]
) {
  const suggestions = []

  // Time-based suggestions
  if (timeMinutes <= 5) {
    suggestions.push(
      { type: 'generated', title: 'Quick email check', description: 'Scan and respond to urgent emails', estimated_duration: 5, category: 'work', xp_reward: 10, why_suggested: 'Perfect for a 5-minute window' },
      { type: 'generated', title: 'Desk organization', description: 'Clear and organize your workspace', estimated_duration: 5, category: 'personal', xp_reward: 8, why_suggested: 'Quick productivity boost' },
      { type: 'generated', title: 'Breathing exercise', description: '5-minute mindfulness breathing', estimated_duration: 5, category: 'wellness', xp_reward: 12, why_suggested: 'Great for mental clarity' }
    )
  } else if (timeMinutes <= 15) {
    suggestions.push(
      { type: 'generated', title: 'Quick brainstorm session', description: 'Jot down ideas for current projects', estimated_duration: 10, category: 'work', xp_reward: 15, why_suggested: 'Productive use of short time' },
      { type: 'generated', title: 'Read industry article', description: 'Catch up on relevant industry news', estimated_duration: 12, category: 'growth', xp_reward: 18, why_suggested: 'Continuous learning opportunity' },
      { type: 'generated', title: 'Plan tomorrow', description: 'Review and adjust tomorrow\'s schedule', estimated_duration: 10, category: 'personal', xp_reward: 20, why_suggested: 'Sets you up for success' }
    )
  } else if (timeMinutes <= 30) {
    suggestions.push(
      { type: 'generated', title: 'Skill practice session', description: 'Practice a skill you\'re developing', estimated_duration: 25, category: 'growth', xp_reward: 35, why_suggested: 'Meaningful progress in available time' },
      { type: 'generated', title: 'Project research', description: 'Research for upcoming project', estimated_duration: 20, category: 'work', xp_reward: 30, why_suggested: 'Advance your projects' },
      { type: 'generated', title: 'Creative writing', description: 'Free writing or journaling session', estimated_duration: 20, category: 'personal', xp_reward: 25, why_suggested: 'Creative and reflective' }
    )
  }

  // Energy-based adjustments
  if (energyLevel <= 4) {
    suggestions.push(
      { type: 'generated', title: 'Gentle stretching', description: 'Light stretches to boost energy', estimated_duration: Math.min(10, timeMinutes), category: 'wellness', xp_reward: 15, why_suggested: 'Low energy, gentle activity' },
      { type: 'generated', title: 'Organize digital files', description: 'Clean up computer files or photos', estimated_duration: Math.min(15, timeMinutes), category: 'personal', xp_reward: 12, why_suggested: 'Low-energy but productive' }
    )
  } else if (energyLevel >= 8) {
    suggestions.push(
      { type: 'generated', title: 'High-focus task sprint', description: 'Tackle a challenging task with full focus', estimated_duration: Math.min(25, timeMinutes), category: 'work', xp_reward: 40, why_suggested: 'High energy, maximize impact' },
      { type: 'generated', title: 'Learning challenge', description: 'Learn something new and challenging', estimated_duration: Math.min(20, timeMinutes), category: 'growth', xp_reward: 35, why_suggested: 'High energy for learning' }
    )
  }

  // Location-based suggestions
  if (location === 'commuting') {
    suggestions.push(
      { type: 'generated', title: 'Listen to podcast', description: 'Educational or motivational podcast', estimated_duration: timeMinutes, category: 'growth', xp_reward: 20, why_suggested: 'Perfect for commuting' },
      { type: 'generated', title: 'Voice memo planning', description: 'Record thoughts and plans via voice memo', estimated_duration: Math.min(10, timeMinutes), category: 'personal', xp_reward: 15, why_suggested: 'Hands-free productivity' }
    )
  }

  // Filter by preferences
  return suggestions.filter(s => {
    if (avoidCategories.includes(s.category)) return false
    if (preferredCategories.length > 0 && !preferredCategories.includes(s.category)) return false
    return s.estimated_duration <= timeMinutes
  })
}

function generateGoalMicroTasks(goal: any, timeMinutes: number) {
  return [
    {
      type: 'goal_related',
      title: `Plan next step for "${goal.title}"`,
      description: `Identify the immediate next action for this goal`,
      estimated_duration: Math.min(10, timeMinutes),
      category: 'planning',
      xp_reward: 25,
      goal_id: goal.id,
      why_suggested: 'Advance your focused goal'
    },
    {
      type: 'goal_related',
      title: `Research for "${goal.title}"`,
      description: `Quick research session related to this goal`,
      estimated_duration: Math.min(15, timeMinutes),
      category: 'research',
      xp_reward: 20,
      goal_id: goal.id,
      why_suggested: 'Build knowledge for your goal'
    }
  ].filter(task => task.estimated_duration <= timeMinutes)
}

function calculateRelevanceScore(suggestion: any, request: MicroTaskRequest): number {
  let score = 50 // Base score

  // Time fit bonus
  if (suggestion.estimated_duration <= request.available_time_minutes) {
    score += 20
  }

  // Exact time match bonus
  if (Math.abs(suggestion.estimated_duration - request.available_time_minutes) <= 2) {
    score += 10
  }

  // Category preference bonus
  if (request.preferred_categories && request.preferred_categories.includes(suggestion.category)) {
    score += 15
  }

  // Energy level match
  const energyLevel = request.current_energy_level || 5
  if (energyLevel <= 4 && suggestion.category === 'wellness') score += 10
  if (energyLevel >= 8 && (suggestion.category === 'work' || suggestion.category === 'growth')) score += 10

  // Existing task bonus (already planned)
  if (suggestion.type === 'existing_task') {
    score += 25
  }

  // Goal focus bonus
  if (request.goal_focus && suggestion.goal_id === request.goal_focus) {
    score += 30
  }

  return score
}

function generateProductivityTips(timeMinutes: number, energyLevel: number): string[] {
  const tips = []

  if (timeMinutes <= 5) {
    tips.push('Even 5 minutes can create momentum for larger tasks')
    tips.push('Use this time to eliminate small friction points')
  } else if (timeMinutes <= 15) {
    tips.push('Perfect time for focused, single-task work')
    tips.push('Avoid multitasking to maximize this short window')
  } else {
    tips.push('Consider breaking this into two focused sessions with a brief break')
    tips.push('This is enough time for meaningful progress on important work')
  }

  if (energyLevel <= 4) {
    tips.push('Start with the easiest task to build momentum')
    tips.push('Consider a quick energy-boosting activity first')
  } else if (energyLevel >= 8) {
    tips.push('Tackle your most challenging or important task')
    tips.push('This is prime time for deep work')
  }

  return tips
}