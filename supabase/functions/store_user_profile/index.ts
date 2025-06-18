import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface StoreUserProfileRequest {
  user_id: string
  values?: string[]
  preferred_planning_style?: string
  voice_tone?: string
  rituals?: string[]
  accountability_type?: string
  celebration_type?: string
  distraction_types?: string[]
  autonomy_preference?: string
  focus_style?: string
  communication_preference?: string
  profile_completed?: boolean
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
    const body: StoreUserProfileRequest = await req.json()

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

    // Verify that the user exists in the database
    const { data: userExists, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id, user_type')
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

    // Prepare profile data
    const profileData = {
      user_id: body.user_id,
      values: body.values || [],
      preferred_planning_style: body.preferred_planning_style || null,
      voice_tone: body.voice_tone || null,
      rituals: body.rituals || [],
      accountability_type: body.accountability_type || null,
      celebration_type: body.celebration_type || null,
      distraction_types: body.distraction_types || [],
      autonomy_preference: body.autonomy_preference || null,
      focus_style: body.focus_style || null,
      communication_preference: body.communication_preference || null,
      profile_completed: body.profile_completed !== undefined ? body.profile_completed : true,
      updated_at: new Date().toISOString(),
    }

    // Try to upsert the profile (insert or update if exists)
    const { data: profile, error: upsertError } = await supabaseClient
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting user profile:', upsertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store user profile', 
          details: upsertError.message 
        }),
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
          action: 'user_profile_updated',
          resource_type: 'user_profile',
          resource_id: profile.id,
          metadata: {
            profile_completed: profileData.profile_completed,
            has_values: (profileData.values || []).length > 0,
            has_rituals: (profileData.rituals || []).length > 0,
            has_distraction_types: (profileData.distraction_types || []).length > 0,
          }
        }
      ])

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the profile storage if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile,
        message: 'User profile stored successfully'
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