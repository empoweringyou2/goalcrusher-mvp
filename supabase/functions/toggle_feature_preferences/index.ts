import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ToggleFeaturePreferencesRequest {
  user_id: string
  preferences: {
    gamification?: boolean
    voice_tone?: 'friendly' | 'motivational' | 'professional' | 'casual'
    dark_mode?: boolean
    data_training_consent?: boolean
    notifications_enabled?: boolean
    sound_enabled?: boolean
    achievements_enabled?: boolean
    email_frequency?: 'never' | 'daily' | 'weekly'
  }
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
    const body: ToggleFeaturePreferencesRequest = await req.json()

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

    if (!body.preferences || Object.keys(body.preferences).length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one preference must be provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify that the user exists in the database
    const { data: userExists, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', body.user_id)
      .single()

    if (userCheckError || !userExists) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id - user does not exist' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare update data for user_settings
    const updateData: { [key: string]: any } = { updated_at: new Date().toISOString() }

    if (body.preferences.gamification !== undefined) {
      updateData.gamification_enabled = body.preferences.gamification
    }
    if (body.preferences.voice_tone !== undefined) {
      const allowedVoiceTones = ['friendly', 'motivational', 'professional', 'casual']
      if (!allowedVoiceTones.includes(body.preferences.voice_tone)) {
        return new Response(
          JSON.stringify({ error: `Invalid voice_tone. Must be one of: ${allowedVoiceTones.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      updateData.crushion_voice_style = body.preferences.voice_tone
    }
    if (body.preferences.dark_mode !== undefined) {
      updateData.dark_mode = body.preferences.dark_mode
    }
    if (body.preferences.data_training_consent !== undefined) {
      updateData.data_training_consent = body.preferences.data_training_consent
    }
    if (body.preferences.notifications_enabled !== undefined) {
      updateData.notifications_enabled = body.preferences.notifications_enabled
    }
    if (body.preferences.sound_enabled !== undefined) {
      updateData.sound_enabled = body.preferences.sound_enabled
    }
    if (body.preferences.achievements_enabled !== undefined) {
      updateData.achievements_enabled = body.preferences.achievements_enabled
    }
    if (body.preferences.email_frequency !== undefined) {
      const allowedEmailFrequencies = ['never', 'daily', 'weekly']
      if (!allowedEmailFrequencies.includes(body.preferences.email_frequency)) {
        return new Response(
          JSON.stringify({ error: `Invalid email_frequency. Must be one of: ${allowedEmailFrequencies.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      updateData.email_frequency = body.preferences.email_frequency
    }

    // Update user settings
    const { data: updatedSettings, error: updateError } = await supabaseClient
      .from('user_settings')
      .update(updateData)
      .eq('user_id', body.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user settings:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user preferences', details: updateError.message }),
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
          user_id: body.user_id,
          action: 'feature_preferences_toggled',
          resource_type: 'user_settings',
          resource_id: updatedSettings.id,
          metadata: body.preferences
        }
      ])

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the settings update if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_settings: updatedSettings,
        message: 'User preferences updated successfully'
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