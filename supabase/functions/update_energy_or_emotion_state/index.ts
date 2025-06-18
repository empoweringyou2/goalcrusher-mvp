import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EnergyEmotionUpdateRequest {
  user_id: string
  energy_level?: number // 1-10
  mood_rating?: number // 1-10
  stress_level?: number // 1-10
  emotional_state?: string
  energy_description?: string
  triggers?: string[]
  duration_expected?: 'temporary' | 'few_hours' | 'rest_of_day' | 'multiple_days' | 'unknown'
  suggested_adaptations?: {
    lighter_tasks?: boolean
    reschedule_demanding_work?: boolean
    add_self_care?: boolean
    adjust_tone?: 'gentler' | 'more_motivational' | 'professional' | 'casual'
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

    const body: EnergyEmotionUpdateRequest = await req.json()

    // Validate required fields
    if (!body.user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate rating ranges
    if (body.energy_level && (body.energy_level < 1 || body.energy_level > 10)) {
      return new Response(
        JSON.stringify({ error: 'energy_level must be between 1 and 10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.mood_rating && (body.mood_rating < 1 || body.mood_rating > 10)) {
      return new Response(
        JSON.stringify({ error: 'mood_rating must be between 1 and 10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.stress_level && (body.stress_level < 1 || body.stress_level > 10)) {
      return new Response(
        JSON.stringify({ error: 'stress_level must be between 1 and 10' }),
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

    const today = new Date().toISOString().split('T')[0]

    // Try to update existing daily check-in or create new one
    const { data: existingCheckin } = await supabaseClient
      .from('daily_checkins')
      .select('*')
      .eq('user_id', body.user_id)
      .eq('checkin_date', today)
      .single()

    let checkinData: any = {
      user_id: body.user_id,
      checkin_date: today
    }

    if (body.energy_level !== undefined) checkinData.energy_level = body.energy_level
    if (body.mood_rating !== undefined) checkinData.mood_rating = body.mood_rating
    if (body.stress_level !== undefined) checkinData.stress_level = body.stress_level

    // Combine notes if updating existing checkin
    if (existingCheckin) {
      const existingNotes = existingCheckin.notes || ''
      const newNote = `Energy/Emotion Update: ${body.emotional_state || ''} ${body.energy_description || ''}`.trim()
      checkinData.notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
    } else {
      checkinData.notes = `${body.emotional_state || ''} ${body.energy_description || ''}`.trim()
    }

    // Upsert the daily check-in
    const { data: checkin, error: checkinError } = await supabaseClient
      .from('daily_checkins')
      .upsert(checkinData, { onConflict: 'user_id,checkin_date' })
      .select()
      .single()

    if (checkinError) {
      console.error('Error updating daily checkin:', checkinError)
    }

    // Generate adaptive recommendations based on current state
    let adaptiveRecommendations = {
      task_adjustments: [] as string[],
      tone_adjustments: [] as string[],
      scheduling_suggestions: [] as string[],
      self_care_suggestions: [] as string[]
    }

    // Low energy recommendations
    if (body.energy_level && body.energy_level <= 4) {
      adaptiveRecommendations.task_adjustments.push('Switch to lighter, less demanding tasks')
      adaptiveRecommendations.scheduling_suggestions.push('Consider rescheduling energy-intensive work')
      adaptiveRecommendations.self_care_suggestions.push('Take breaks every 25-30 minutes')
      adaptiveRecommendations.tone_adjustments.push('Use gentler, more supportive communication')
    }

    // High stress recommendations
    if (body.stress_level && body.stress_level >= 7) {
      adaptiveRecommendations.task_adjustments.push('Focus on one task at a time')
      adaptiveRecommendations.self_care_suggestions.push('Include 5-minute breathing exercises')
      adaptiveRecommendations.scheduling_suggestions.push('Add buffer time between tasks')
      adaptiveRecommendations.tone_adjustments.push('Use calming, reassuring language')
    }

    // Low mood recommendations
    if (body.mood_rating && body.mood_rating <= 4) {
      adaptiveRecommendations.task_adjustments.push('Start with small, achievable wins')
      adaptiveRecommendations.self_care_suggestions.push('Consider mood-boosting activities')
      adaptiveRecommendations.tone_adjustments.push('Use more encouraging and motivational language')
    }

    // Store the energy/emotion state update
    const { data: stateLog, error: logError } = await supabaseClient
      .from('analytics_snapshots')
      .insert([
        {
          user_id: body.user_id,
          snapshot_date: today,
          snapshot_type: 'daily',
          data: {
            type: 'energy_emotion_update',
            energy_level: body.energy_level,
            mood_rating: body.mood_rating,
            stress_level: body.stress_level,
            emotional_state: body.emotional_state,
            energy_description: body.energy_description,
            triggers: body.triggers,
            duration_expected: body.duration_expected,
            suggested_adaptations: body.suggested_adaptations,
            adaptive_recommendations: adaptiveRecommendations,
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single()

    // Get recent energy/mood patterns for insights
    const { data: recentStates } = await supabaseClient
      .from('daily_checkins')
      .select('checkin_date, energy_level, mood_rating, stress_level')
      .eq('user_id', body.user_id)
      .gte('checkin_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('checkin_date', { ascending: false })

    let patterns = {
      energy_trend: 'stable',
      mood_trend: 'stable',
      stress_trend: 'stable',
      average_energy: 0,
      average_mood: 0,
      average_stress: 0
    }

    if (recentStates && recentStates.length > 1) {
      const energyLevels = recentStates.filter(s => s.energy_level).map(s => s.energy_level)
      const moodRatings = recentStates.filter(s => s.mood_rating).map(s => s.mood_rating)
      const stressLevels = recentStates.filter(s => s.stress_level).map(s => s.stress_level)

      if (energyLevels.length > 0) {
        patterns.average_energy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length
        patterns.energy_trend = energyLevels[0] > energyLevels[energyLevels.length - 1] ? 'improving' : 
                                energyLevels[0] < energyLevels[energyLevels.length - 1] ? 'declining' : 'stable'
      }

      if (moodRatings.length > 0) {
        patterns.average_mood = moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length
        patterns.mood_trend = moodRatings[0] > moodRatings[moodRatings.length - 1] ? 'improving' : 
                             moodRatings[0] < moodRatings[moodRatings.length - 1] ? 'declining' : 'stable'
      }

      if (stressLevels.length > 0) {
        patterns.average_stress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length
        patterns.stress_trend = stressLevels[0] < stressLevels[stressLevels.length - 1] ? 'improving' : 
                               stressLevels[0] > stressLevels[stressLevels.length - 1] ? 'declining' : 'stable'
      }
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          user_id: body.user_id,
          action: 'energy_emotion_state_updated',
          resource_type: 'daily_checkin',
          resource_id: checkin?.id,
          metadata: {
            energy_level: body.energy_level,
            mood_rating: body.mood_rating,
            stress_level: body.stress_level,
            has_triggers: (body.triggers || []).length > 0
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        checkin_updated: !!checkin,
        state_logged: !!stateLog,
        adaptive_recommendations: adaptiveRecommendations,
        patterns: patterns,
        message: 'Energy and emotion state updated successfully'
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