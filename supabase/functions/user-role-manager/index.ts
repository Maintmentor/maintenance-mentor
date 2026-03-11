import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'get_user_permissions':
        return await getUserPermissions(supabaseClient, user.id)
      case 'assign_role':
        return await assignRole(supabaseClient, user.id, params)
      case 'remove_role':
        return await removeRole(supabaseClient, user.id, params)
      case 'get_user_roles':
        return await getUserRoles(supabaseClient, params.userId || user.id)
      case 'verify_email':
        return await verifyEmail(supabaseClient, params)
      case 'log_session':
        return await logSession(supabaseClient, user.id, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getUserPermissions(supabaseClient: any, userId: string) {
  const { data: roleAssignments, error } = await supabaseClient
    .from('user_role_assignments')
    .select(`
      user_roles!inner(name),
      role_permissions!inner(
        permissions!inner(resource, action)
      )
    `)
    .eq('user_id', userId)
    .is('expires_at', null)

  if (error) throw error

  const permissions: any = {}
  const roles: string[] = []

  roleAssignments?.forEach((assignment: any) => {
    roles.push(assignment.user_roles.name)
    assignment.role_permissions?.forEach((rp: any) => {
      const { resource, action } = rp.permissions
      if (!permissions[resource]) {
        permissions[resource] = {}
      }
      permissions[resource][action] = true
    })
  })

  return new Response(
    JSON.stringify({ permissions, roles }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function assignRole(supabaseClient: any, assignerId: string, params: any) {
  const { userId, roleName } = params

  const { data: role } = await supabaseClient
    .from('user_roles')
    .select('id')
    .eq('name', roleName)
    .single()

  if (!role) {
    return new Response(
      JSON.stringify({ error: 'Role not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabaseClient
    .from('user_role_assignments')
    .upsert({
      user_id: userId,
      role_id: role.id,
      assigned_by: assignerId
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function removeRole(supabaseClient: any, removerId: string, params: any) {
  const { userId, roleName } = params

  const { data: role } = await supabaseClient
    .from('user_roles')
    .select('id')
    .eq('name', roleName)
    .single()

  if (!role) {
    return new Response(
      JSON.stringify({ error: 'Role not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabaseClient
    .from('user_role_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', role.id)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserRoles(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient
    .from('user_role_assignments')
    .select('user_roles!inner(name, description)')
    .eq('user_id', userId)

  if (error) throw error

  const roles = data?.map((assignment: any) => assignment.user_roles) || []

  return new Response(
    JSON.stringify({ roles }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function verifyEmail(supabaseClient: any, params: any) {
  const { token } = params

  const { data: tokenData, error } = await supabaseClient
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  await supabaseClient
    .from('email_verification_tokens')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', tokenData.id)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function logSession(supabaseClient: any, userId: string, params: any) {
  const { sessionAction, ipAddress, userAgent, location } = params

  const { error } = await supabaseClient
    .from('session_logs')
    .insert({
      user_id: userId,
      action: sessionAction,
      ip_address: ipAddress,
      user_agent: userAgent,
      location
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}