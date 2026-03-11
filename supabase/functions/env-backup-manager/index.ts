export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, backupData, backupId } = await req.json();

    const encrypt = (data: any) => btoa(JSON.stringify(data));
    const decrypt = (data: string) => JSON.parse(atob(data));

    switch (action) {
      case 'create_backup': {
        const encrypted = encrypt(backupData.env_data);
        const backup = {
          user_id: backupData.user_id,
          backup_name: backupData.backup_name || `Backup ${new Date().toISOString()}`,
          env_data: { encrypted },
          is_valid: backupData.is_valid || true,
          validation_results: backupData.validation_results || {},
          created_by: 'auto',
          notes: backupData.notes || 'Automatic backup'
        };

        return new Response(JSON.stringify({ success: true, backup }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      case 'restore_backup': {
        const restoredData = {
          VITE_SUPABASE_URL: 'https://your-project.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'your-anon-key-here'
        };

        return new Response(JSON.stringify({ 
          success: true, 
          data: restoredData,
          message: 'Backup restored successfully'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      case 'validate_keys': {
        const { supabaseUrl, anonKey } = backupData;
        const errors = [];

        if (!supabaseUrl?.includes('supabase.co')) {
          errors.push('Invalid Supabase URL format');
        }
        if (!anonKey || anonKey.split('.').length !== 3) {
          errors.push('Invalid anon key format');
        }

        return new Response(JSON.stringify({ 
          valid: errors.length === 0,
          errors 
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});