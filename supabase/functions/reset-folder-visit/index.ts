import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folder_id } = await req.json();

    if (!folder_id) {
      throw new Error('folder_id is required');
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with user context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
    });

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify folder ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folder_id)
      .eq('owner_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // Call the reset function
    const { data, error } = await supabase.rpc('reset_folder_unread_count', {
      p_user_id: user.id,
      p_folder_id: folder_id,
    });

    if (error) {
      console.error('Error resetting folder visit:', error);
      throw error;
    }

    console.log(`Reset unread count for folder ${folder_id}, user ${user.id}, count was: ${data}`);

    return new Response(
      JSON.stringify({
        success: true,
        reset_count: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Reset folder visit error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
