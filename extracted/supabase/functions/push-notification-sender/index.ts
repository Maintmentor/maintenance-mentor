export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { title, body, type, data, userId, userIds } = await req.json();

    // Get active subscriptions
    let query = supabaseClient
      .from('push_subscriptions')
      .select('*, notification_preferences(*)')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    const results = [];

    for (const sub of subscriptions || []) {
      // Check user preferences
      const prefs = sub.notification_preferences;
      if (prefs && !prefs[type]) continue;

      // Check quiet hours
      if (prefs?.quiet_hours_start && prefs?.quiet_hours_end) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
        const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
        const quietStart = startH * 60 + startM;
        const quietEnd = endH * 60 + endM;
        
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          continue;
        }
      }

      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: `storage-${type}`,
          requireInteraction: type === 'critical_alerts',
          data: { ...data, url: '/admin?tab=storage', type },
          actions: [
            { action: 'view', title: 'View Dashboard' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });

        console.log('Sending push to:', sub.endpoint);

        const { data: historyData } = await supabaseClient
          .from('notification_history')
          .insert({
            user_id: sub.user_id,
            subscription_id: sub.id,
            title,
            body,
            type,
            data
          })
          .select()
          .single();

        results.push({
          subscription_id: sub.id,
          success: true,
          notification_id: historyData?.id
        });

        await supabaseClient
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);

      } catch (error) {
        results.push({
          subscription_id: sub.id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
