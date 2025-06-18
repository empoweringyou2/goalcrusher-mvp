import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RescheduleTaskRequest {
  user_id: string
  task_id: string
  new_scheduled_date?: string
  new_scheduled_time?: string
  new_due_date?: string
  reason: 'conflict' | 'missed_deadline' | 'user_request' | 'energy_mismatch' | 'priority_change'
  reason_description?: string
  auto_adjust_related?: boolean
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

    const body: RescheduleTaskRequest = await req.json()

    // Validate required fields
    if (!body.user_id || !body.task_id || !body.reason) {
      return new Response(
        JSON.stringify({ error: 'user_id, task_id, and reason are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the existing task
    const { data: existingTask, error: taskError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', body.task_id)
      .eq('user_id', body.user_id)
      .single()

    if (taskError || !existingTask) {
      return new Response(
        JSON.stringify({ error: 'Task not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.new_scheduled_date) {
      updateData.scheduled_date = body.new_scheduled_date
    }

    if (body.new_scheduled_time) {
      updateData.scheduled_time = body.new_scheduled_time
    }

    if (body.new_due_date) {
      updateData.due_date = body.new_due_date
    }

    // Combine date and time for scheduled_for if both are provided
    if (body.new_scheduled_date && body.new_scheduled_time) {
      updateData.scheduled_for = new Date(`${body.new_scheduled_date}T${body.new_scheduled_time}`).toISOString()
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabaseClient
      .from('tasks')
      .update(updateData)
      .eq('id', body.task_id)
      .eq('user_id', body.user_id)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to reschedule task', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the reschedule event
    const { error: logError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'task_reschedule',
            task_id: body.task_id,
            task_title: existingTask.title,
            reason: body.reason,
            reason_description: body.reason_description,
            old_schedule: {
              scheduled_date: existingTask.scheduled_date,
              scheduled_time: existingTask.scheduled_time,
              due_date: existingTask.due_date
            },
            new_schedule: {
              scheduled_date: body.new_scheduled_date,
              scheduled_time: body.new_scheduled_time,
              due_date: body.new_due_date
            },
            timestamp: new Date().toISOString()
          }
        }
      ])

    // Handle auto-adjustment of related tasks if requested
    let relatedTasksAdjusted = 0
    if (body.auto_adjust_related && existingTask.goal_id) {
      const { data: relatedTasks } = await supabaseClient
        .from('tasks')
        .select('id, scheduled_date')
        .eq('goal_id', existingTask.goal_id)
        .eq('user_id', body.user_id)
        .neq('id', body.task_id)
        .gte('scheduled_date', existingTask.scheduled_date)

      if (relatedTasks && relatedTasks.length > 0) {
        // Shift related tasks by the same amount of days
        const oldDate = new Date(existingTask.scheduled_date || existingTask.created_at)
        const newDate = new Date(body.new_scheduled_date || existingTask.scheduled_date || existingTask.created_at)
        const daysDiff = Math.ceil((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff !== 0) {
          for (const relatedTask of relatedTasks) {
            const relatedOldDate = new Date(relatedTask.scheduled_date)
            const relatedNewDate = new Date(relatedOldDate.getTime() + (daysDiff * 24 * 60 * 60 * 1000))
            
            await supabaseClient
              .from('tasks')
              .update({ 
                scheduled_date: relatedNewDate.toISOString().split('T')[0],
                updated_at: new Date().toISOString()
              })
              .eq('id', relatedTask.id)
              .eq('user_id', body.user_id)
            
            relatedTasksAdjusted++
          }
        }
      }
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'task_rescheduled',
          resource_type: 'task',
          resource_id: body.task_id,
          metadata: {
            reason: body.reason,
            related_tasks_adjusted: relatedTasksAdjusted,
            old_date: existingTask.scheduled_date,
            new_date: body.new_scheduled_date
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        task: updatedTask,
        related_tasks_adjusted: relatedTasksAdjusted,
        message: 'Task rescheduled successfully'
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