import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AdjustPlanRequest {
  user_id: string
  feedback_type: 'emotional' | 'external' | 'energy' | 'circumstantial'
  feedback_description: string
  affected_goals?: string[]
  affected_tasks?: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggested_adjustments?: {
    reschedule_days?: number
    reduce_workload?: boolean
    change_priorities?: boolean
    pause_goals?: boolean
  }
  emotional_context?: {
    current_mood: string
    stress_level: number
    energy_level: number
  }
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

    const body: AdjustPlanRequest = await req.json()

    // Validate required fields
    if (!body.user_id || !body.feedback_type || !body.feedback_description || !body.severity) {
      return new Response(
        JSON.stringify({ error: 'user_id, feedback_type, feedback_description, and severity are required' }),
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

    // Get current active goals and tasks
    const { data: activeGoals } = await supabaseClient
      .from('goals')
      .select('id, title, status, priority, target_date')
      .eq('user_id', body.user_id)
      .eq('status', 'active')

    const { data: pendingTasks } = await supabaseClient
      .from('tasks')
      .select('id, title, status, priority, scheduled_date, due_date')
      .eq('user_id', body.user_id)
      .in('status', ['pending', 'in_progress'])

    // Create adjustment plan based on severity and feedback
    let adjustmentPlan = {
      goals_affected: body.affected_goals || [],
      tasks_affected: body.affected_tasks || [],
      recommended_actions: [] as string[],
      timeline_adjustments: {} as any,
      priority_changes: {} as any
    }

    // Apply severity-based adjustments
    switch (body.severity) {
      case 'critical':
        adjustmentPlan.recommended_actions.push('Pause all non-essential goals')
        adjustmentPlan.recommended_actions.push('Reschedule tasks by 1-2 weeks')
        adjustmentPlan.recommended_actions.push('Focus on self-care and recovery')
        break
      case 'high':
        adjustmentPlan.recommended_actions.push('Reduce workload by 50%')
        adjustmentPlan.recommended_actions.push('Reschedule tasks by 3-7 days')
        adjustmentPlan.recommended_actions.push('Lower priority expectations')
        break
      case 'medium':
        adjustmentPlan.recommended_actions.push('Adjust timeline by 1-3 days')
        adjustmentPlan.recommended_actions.push('Consider lighter alternatives')
        break
      case 'low':
        adjustmentPlan.recommended_actions.push('Minor schedule adjustments')
        adjustmentPlan.recommended_actions.push('Monitor progress closely')
        break
    }

    // Store the feedback and adjustment plan
    const { data: feedbackLog, error: feedbackError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'plan_adjustment_feedback',
            feedback_type: body.feedback_type,
            feedback_description: body.feedback_description,
            severity: body.severity,
            adjustment_plan: adjustmentPlan,
            emotional_context: body.emotional_context,
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single()

    if (feedbackError) {
      console.error('Error storing feedback:', feedbackError)
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'plan_adjusted_based_on_feedback',
          resource_type: 'plan_adjustment',
          metadata: {
            feedback_type: body.feedback_type,
            severity: body.severity,
            goals_count: activeGoals?.length || 0,
            tasks_count: pendingTasks?.length || 0
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        adjustment_plan: adjustmentPlan,
        affected_goals: activeGoals?.length || 0,
        affected_tasks: pendingTasks?.length || 0,
        feedback_logged: !!feedbackLog,
        message: 'Plan adjusted successfully based on feedback'
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