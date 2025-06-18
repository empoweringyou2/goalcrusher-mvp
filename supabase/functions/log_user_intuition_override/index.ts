import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface IntuitionOverrideRequest {
  user_id: string
  decision_context: string
  crushion_recommendation: string
  user_intuition_choice: string
  confidence_level: number // 1-10
  reasoning: string
  related_goal_id?: string
  related_task_id?: string
  risk_level: 'low' | 'medium' | 'high'
  potential_outcomes?: {
    positive: string[]
    negative: string[]
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

    const body: IntuitionOverrideRequest = await req.json()

    // Validate required fields
    if (!body.user_id || !body.decision_context || !body.crushion_recommendation || 
        !body.user_intuition_choice || !body.reasoning || !body.risk_level) {
      return new Response(
        JSON.stringify({ error: 'user_id, decision_context, crushion_recommendation, user_intuition_choice, reasoning, and risk_level are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.confidence_level < 1 || body.confidence_level > 10) {
      return new Response(
        JSON.stringify({ error: 'confidence_level must be between 1 and 10' }),
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

    // Store the intuition override log
    const { data: overrideLog, error: logError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          snapshot_type: 'daily',
          data: {
            type: 'intuition_override',
            decision_context: body.decision_context,
            crushion_recommendation: body.crushion_recommendation,
            user_intuition_choice: body.user_intuition_choice,
            confidence_level: body.confidence_level,
            reasoning: body.reasoning,
            related_goal_id: body.related_goal_id,
            related_task_id: body.related_task_id,
            risk_level: body.risk_level,
            potential_outcomes: body.potential_outcomes,
            timestamp: new Date().toISOString(),
            follow_up_needed: true // Flag for tracking outcomes later
          }
        }
      ])
      .select()
      .single()

    if (logError) {
      return new Response(
        JSON.stringify({ error: 'Failed to log intuition override', details: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's historical override patterns for insights
    const { data: historicalOverrides } = await supabaseClient
      .from('analytics_snapshots')
      .select('data')
      .eq('user_id', body.user_id)
      .eq('snapshot_type', 'daily')
      .gte('snapshot_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 90 days
      .order('snapshot_date', { ascending: false })

    let overridePatterns = {
      total_overrides: 0,
      high_confidence_overrides: 0,
      risk_distribution: { low: 0, medium: 0, high: 0 },
      average_confidence: 0
    }

    if (historicalOverrides) {
      const overrideData = historicalOverrides
        .filter(snapshot => snapshot.data?.type === 'intuition_override')
        .map(snapshot => snapshot.data)

      overridePatterns.total_overrides = overrideData.length
      overridePatterns.high_confidence_overrides = overrideData.filter(d => d.confidence_level >= 8).length
      overridePatterns.average_confidence = overrideData.length > 0 
        ? overrideData.reduce((sum, d) => sum + d.confidence_level, 0) / overrideData.length 
        : 0

      overrideData.forEach(d => {
        if (d.risk_level in overridePatterns.risk_distribution) {
          overridePatterns.risk_distribution[d.risk_level as keyof typeof overridePatterns.risk_distribution]++
        }
      })
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'intuition_override_logged',
          resource_type: 'decision_log',
          resource_id: overrideLog.id,
          metadata: {
            confidence_level: body.confidence_level,
            risk_level: body.risk_level,
            related_goal_id: body.related_goal_id,
            related_task_id: body.related_task_id
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        override_log_id: overrideLog.id,
        patterns: overridePatterns,
        insights: {
          confidence_trend: overridePatterns.average_confidence >= 7 ? 'high' : overridePatterns.average_confidence >= 5 ? 'medium' : 'low',
          risk_preference: Object.entries(overridePatterns.risk_distribution).reduce((a, b) => overridePatterns.risk_distribution[a[0] as keyof typeof overridePatterns.risk_distribution] > overridePatterns.risk_distribution[b[0] as keyof typeof overridePatterns.risk_distribution] ? a : b)[0],
          override_frequency: overridePatterns.total_overrides > 10 ? 'frequent' : overridePatterns.total_overrides > 3 ? 'moderate' : 'rare'
        },
        message: 'Intuition override logged successfully'
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