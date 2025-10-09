import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  fileId: string;
  expiresInDays?: number; // Optional: default 7 days
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { fileId, expiresInDays = 7 }: RequestBody = await req.json();

    if (!fileId) {
      console.error('Missing fileId in request');
      return new Response(
        JSON.stringify({ error: 'Missing fileId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating share link for file: ${fileId}, user: ${user.id}`);

    // Verify user owns the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, owner_id, title')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      console.error('File not found:', fileError);
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (file.owner_id !== user.id) {
      console.error(`Access denied: file owner ${file.owner_id} !== user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token (crypto.randomUUID provides cryptographically secure random)
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create share link
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('shared_links')
      .insert({
        file_id: fileId,
        owner_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Failed to create share link:', shareLinkError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Share link created successfully: ${shareLink.id}`);

    return new Response(
      JSON.stringify({
        token: shareLink.token,
        expiresAt: shareLink.expires_at,
        shareUrl: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '')}/share/${shareLink.token}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-share-link function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
