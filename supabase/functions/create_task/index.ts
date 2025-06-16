import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateTaskRequest {
  title: string
  description?: string
  category?: string
  estimated_duration?: number
  scheduled_date?: string
  scheduled_time?: string
  priority?: 'low' | 'medium' | 'high'
  goal_id?: string
  xp_reward?: number
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
    const body: CreateTaskRequest = await req.json()

    // Validate required fields
    if (!body.title || body.title.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.scheduled_date) {
      return new Response(
        JSON.stringify({ error: 'scheduled_date is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.scheduled_time) {
      return new Response(
        JSON.stringify({ error: 'scheduled_time is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Combine scheduled_date and scheduled_time into a full datetime
    const scheduledFor = new Date(`${body.scheduled_date}T${body.scheduled_time}`)
    
    if (isNaN(scheduledFor.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid scheduled_date or scheduled_time format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // For this demo, we'll use a hardcoded user ID since we're bypassing auth
    // In production, you'd get this from the authenticated user
    const userId = 'dev-user-123'

    // Prepare task data
    const taskData = {
      user_id: userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category || 'general',
      estimated_duration: body.estimated_duration || 30,
      scheduled_for: scheduledFor.toISOString(),
      priority: body.priority || 'medium',
      goal_id: body.goal_id || null,
      xp_reward: body.xp_reward || 25,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    // Insert the task
    const { data: task, error: insertError } = await supabaseClient
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating task:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create task', details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create audit log entry
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action: 'task_created',
          resource_type: 'task',
          resource_id: task.id,
          metadata: {
            task_title: task.title,
            category: task.category,
            priority: task.priority,
            scheduled_for: scheduledFor.toISOString(),
          }
        }
      ])

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the task creation if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        task: task,
        message: 'Task created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
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