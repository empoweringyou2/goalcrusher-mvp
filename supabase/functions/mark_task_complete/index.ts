import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MarkTaskCompleteRequest {
  user_id: string
  task_id: string
  reflection?: string
  completion_method: 'manual' | 'voice' | 'ai_reminder' | 'accountability_checkin'
  mood_rating?: number // 1-5 scale
  effort_rating?: number // 1-5 scale
  satisfaction_rating?: number // 1-5 scale
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body: MarkTaskCompleteRequest = await req.json()

    // Validate required fields
    if (!body.user_id || body.user_id.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.task_id || body.task_id.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'task_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.completion_method) {
      return new Response(
        JSON.stringify({ error: 'completion_method is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate rating ranges if provided
    if (body.mood_rating && (body.mood_rating < 1 || body.mood_rating > 5)) {
      return new Response(
        JSON.stringify({ error: 'mood_rating must be between 1 and 5' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.effort_rating && (body.effort_rating < 1 || body.effort_rating > 5)) {
      return new Response(
        JSON.stringify({ error: 'effort_rating must be between 1 and 5' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.satisfaction_rating && (body.satisfaction_rating < 1 || body.satisfaction_rating > 5)) {
      return new Response(
        JSON.stringify({ error: 'satisfaction_rating must be between 1 and 5' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the existing task and verify ownership
    const { data: existingTask, error: taskError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', body.task_id)
      .eq('user_id', body.user_id)
      .single()

    if (taskError || !existingTask) {
      return new Response(
        JSON.stringify({ error: 'Task not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if task is already completed
    if (existingTask.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Task was already completed',
          task: existingTask,
          xp_gained: 0,
          already_completed: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate XP reward
    const baseXP = existingTask.xp_reward || 25
    let xpMultiplier = 1.0

    // Bonus XP for different completion methods
    switch (body.completion_method) {
      case 'accountability_checkin':
        xpMultiplier = 1.2 // 20% bonus for accountability
        break
      case 'voice':
        xpMultiplier = 1.1 // 10% bonus for voice completion
        break
      case 'ai_reminder':
        xpMultiplier = 1.05 // 5% bonus for AI reminder completion
        break
      default:
        xpMultiplier = 1.0
    }

    // Bonus XP for high satisfaction
    if (body.satisfaction_rating && body.satisfaction_rating >= 4) {
      xpMultiplier += 0.1 // Additional 10% for high satisfaction
    }

    const finalXP = Math.round(baseXP * xpMultiplier)

    // Update the task
    const { data: updatedTask, error: updateError } = await supabaseClient
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.task_id)
      .eq('user_id', body.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to mark task complete', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Log the completion in analytics
    const { error: analyticsError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'task_completion',
            task_id: body.task_id,
            task_title: existingTask.title,
            task_category: existingTask.category,
            completion_method: body.completion_method,
            xp_gained: finalXP,
            reflection: body.reflection,
            mood_rating: body.mood_rating,
            effort_rating: body.effort_rating,
            satisfaction_rating: body.satisfaction_rating,
            estimated_duration: existingTask.estimated_duration,
            priority: existingTask.priority,
            timestamp: new Date().toISOString()
          }
        }
      ])

    if (analyticsError) {
      console.error('Error logging analytics:', analyticsError)
      // Don't fail the completion if analytics logging fails
    }

    // Handle accountability logging if the task has accountability
    let accountabilityLogged = false
    if (existingTask.goal_id) {
      // Check if this task is part of an accountability partnership
      const { data: accountabilityPartnerships } = await supabaseClient
        .from('accountability_partnerships')
        .select('id, partnership_type, partner_id')
        .eq('user_id', body.user_id)
        .eq('status', 'active')

      if (accountabilityPartnerships && accountabilityPartnerships.length > 0) {
        // Log accountability completion for each active partnership
        for (const partnership of accountabilityPartnerships) {
          await supabaseClient
            .from('accountability_logs')
            .insert([
              {
                partnership_id: partnership.id,
                user_id: body.user_id,
                task_id: body.task_id,
                commitment_type: 'task',
                commitment_description: `Completed task: ${existingTask.title}`,
                status: 'completed',
                check_in_time: new Date().toISOString(),
                notes: body.reflection || `Task completed via ${body.completion_method}`
              }
            ])
        }
        accountabilityLogged = true
      }
    }

    // Update habit completion if this is a recurring habit-like task
    if (existingTask.category === 'wellness' || existingTask.category === 'fitness') {
      // Check if there's a corresponding habit
      const { data: relatedHabit } = await supabaseClient
        .from('habits')
        .select('id')
        .eq('user_id', body.user_id)
        .eq('name', existingTask.title)
        .single()

      if (relatedHabit) {
        // Log habit completion
        await supabaseClient
          .from('habit_completions')
          .upsert([
            {
              habit_id: relatedHabit.id,
              user_id: body.user_id,
              completion_date: new Date().toISOString().split('T')[0],
              completed_at: new Date().toISOString(),
              notes: body.reflection,
              mood_rating: body.mood_rating
            }
          ], { onConflict: 'habit_id,completion_date' })

        // Update habit streak
        await supabaseClient
          .from('habit_streaks')
          .upsert([
            {
              habit_id: relatedHabit.id,
              user_id: body.user_id,
              last_completion_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            }
          ], { onConflict: 'habit_id,user_id' })
      }
    }

    // Create audit log entry
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'task_completed',
          resource_type: 'task',
          resource_id: body.task_id,
          metadata: {
            completion_method: body.completion_method,
            xp_gained: finalXP,
            has_reflection: !!body.reflection,
            mood_rating: body.mood_rating,
            effort_rating: body.effort_rating,
            satisfaction_rating: body.satisfaction_rating,
            accountability_logged: accountabilityLogged
          }
        }
      ])

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the completion if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        task: updatedTask,
        xp_gained: finalXP,
        accountability_logged: accountabilityLogged,
        streak_updated: existingTask.category === 'wellness' || existingTask.category === 'fitness',
        message: 'Task completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})