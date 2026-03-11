import { createClient } from '@supabase/supabase-js';

// Get environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
  console.error('Please check your .env file and ensure both variables are set.');
  console.warn('⚠️ Using placeholder Supabase client - app will have limited functionality');
}

// Initialize Supabase client (with placeholders if env vars missing)
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'repair-student-tools'
      },
      fetch: (url, options = {}) => {
        // Use longer timeout for edge function calls (120s), shorter for other requests (30s)
        const isEdgeFunction = typeof url === 'string' && url.includes('/functions/v1/');
        const timeoutMs = isEdgeFunction ? 120000 : 30000;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        // If the caller already provided a signal, listen to it too
        const existingSignal = (options as any)?.signal;
        if (existingSignal) {
          existingSignal.addEventListener('abort', () => controller.abort());
        }
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
      }
    }
  }
);



export { supabase };
