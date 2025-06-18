import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MilestoneEventRequest {
  user_id: string
  event_title: string
  event_description: string
  event_type: 'achievement' | 'breakthrough' | 'launch' | 'completion' | 'recognition' | 'learning' | 'personal' | 'other'
  significance_level: number // 1-10
  related_goal_id?: string
  related_life_domain?: string
  emotions_felt?: string[]
  lessons_learned?: string[]
  next_steps?: string[]
  celebration_planned?: boolean
  share_publicly?: boolean
  impact_areas?: string[]
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

    const body: MilestoneEventRequest = await req.json()

    // Validate required fields
    if (!body.user_id || !body.event_title || !body.event_description || !body.event_type) {
      return new Response(
        JSON.stringify({ error: 'user_id, event_title, event_description, and event_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.significance_level && (body.significance_level < 1 || body.significance_level > 10)) {
      return new Response(
        JSON.stringify({ error: 'significance_level must be between 1 and 10' }),
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

    // Calculate XP reward based on significance level and type
    let xpReward = 0
    const baseXP = {
      'achievement': 100,
      'breakthrough': 150,
      'launch': 200,
      'completion': 75,
      'recognition': 125,
      'learning': 50,
      'personal': 75,
      'other': 50
    }

    xpReward = (baseXP[body.event_type] || 50) * (body.significance_level || 5) / 5

    // Store the milestone event
    const { data: milestoneLog, error: logError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'milestone_event',
            event_title: body.event_title,
            event_description: body.event_description,
            event_type: body.event_type,
            significance_level: body.significance_level || 5,
            related_goal_id: body.related_goal_id,
            related_life_domain: body.related_life_domain,
            emotions_felt: body.emotions_felt || [],
            lessons_learned: body.lessons_learned || [],
            next_steps: body.next_steps || [],
            celebration_planned: body.celebration_planned || false,
            share_publicly: body.share_publicly || false,
            impact_areas: body.impact_areas || [],
            xp_reward: xpReward,
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single()

    if (logError) {
      return new Response(
        JSON.stringify({ error: 'Failed to log milestone event', details: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update related goal if specified
    let goalUpdated = false
    if (body.related_goal_id) {
      const { data: goal, error: goalError } = await supabaseClient
        .from('goals')
        .select('completion_percentage, xp_reward')
        .eq('id', body.related_goal_id)
        .eq('user_id', body.user_id)
        .single()

      if (!goalError && goal) {
        // Add milestone XP to goal's XP reward
        await supabaseClient
          .from('goals')
          .update({ 
            xp_reward: (goal.xp_reward || 0) + Math.floor(xpReward * 0.5),
            updated_at: new Date().toISOString()
          })
          .eq('id', body.related_goal_id)
          .eq('user_id', body.user_id)
        
        goalUpdated = true
      }
    }

    // Get user's recent milestone patterns for insights
    const { data: recentMilestones } = await supabaseClient
      .from('analytics_snapshots')
      .select('data')
      .eq('user_id', body.user_id)
      .eq('snapshot_type', 'daily')
      .gte('snapshot_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })

    let milestonePatterns = {
      total_milestones: 0,
      milestone_frequency: 'low',
      most_common_type: 'other',
      average_significance: 0,
      celebration_rate: 0
    }

    if (recentMilestones) {
      const milestoneData = recentMilestones
        .filter(snapshot => snapshot.data?.type === 'milestone_event')
        .map(snapshot => snapshot.data)

      milestonePatterns.total_milestones = milestoneData.length
      milestonePatterns.milestone_frequency = milestoneData.length > 10 ? 'high' : milestoneData.length > 3 ? 'medium' : 'low'
      
      if (milestoneData.length > 0) {
        milestonePatterns.average_significance = milestoneData.reduce((sum, d) => sum + (d.significance_level || 5), 0) / milestoneData.length
        milestonePatterns.celebration_rate = milestoneData.filter(d => d.celebration_planned).length / milestoneData.length

        // Find most common event type
        const typeCounts = milestoneData.reduce((acc, d) => {
          acc[d.event_type] = (acc[d.event_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        milestonePatterns.most_common_type = Object.entries(typeCounts).reduce((a, b) => typeCounts[a[0]] > typeCounts[b[0]] ? a : b)[0]
      }
    }

    // Generate celebration suggestions if not planned
    let celebrationSuggestions: string[] = []
    if (!body.celebration_planned) {
      if (body.significance_level && body.significance_level >= 8) {
        celebrationSuggestions = [
          'Plan a special dinner or outing',
          'Share your achievement with friends and family',
          'Take a day off to enjoy your success',
          'Buy yourself something meaningful'
        ]
      } else if (body.significance_level && body.significance_level >= 6) {
        celebrationSuggestions = [
          'Treat yourself to something small but special',
          'Share the news with a close friend',
          'Take a moment to reflect on your journey',
          'Do something you enjoy'
        ]
      } else {
        celebrationSuggestions = [
          'Take a few minutes to appreciate your progress',
          'Write about this moment in a journal',
          'Share with someone who supported you'
        ]
      }
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'milestone_event_logged',
          resource_type: 'milestone',
          resource_id: milestoneLog.id,
          metadata: {
            event_type: body.event_type,
            significance_level: body.significance_level,
            xp_reward: xpReward,
            related_goal_id: body.related_goal_id,
            goal_updated: goalUpdated
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        milestone_log_id: milestoneLog.id,
        xp_reward: xpReward,
        goal_updated: goalUpdated,
        patterns: milestonePatterns,
        celebration_suggestions: celebrationSuggestions,
        insights: {
          milestone_momentum: milestonePatterns.milestone_frequency,
          celebration_habit: milestonePatterns.celebration_rate > 0.7 ? 'strong' : milestonePatterns.celebration_rate > 0.3 ? 'moderate' : 'needs_improvement',
          significance_trend: milestonePatterns.average_significance > 7 ? 'high_impact' : milestonePatterns.average_significance > 5 ? 'moderate_impact' : 'building_momentum'
        },
        message: 'Milestone event logged successfully'
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