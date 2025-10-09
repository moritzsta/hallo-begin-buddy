import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { token }: RequestBody = await req.json();

    if (!token) {
      console.error('Missing token in request');
      return new Response(
        JSON.stringify({ error: 'Missing token parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching shared file for token: ${token.substring(0, 8)}...`);

    // Create Supabase client with service role for public access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch share link
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('shared_links')
      .select('*')
      .eq('token', token)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Share link not found:', shareLinkError);
      return new Response(
        JSON.stringify({ error: 'Share link not found or expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link is expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      console.error('Share link expired');
      return new Response(
        JSON.stringify({ error: 'Share link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch file details
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, title, mime, storage_path, size, created_at, preview_state')
      .eq('id', shareLink.file_id)
      .single();

    if (fileError || !file) {
      console.error('File not found:', fileError);
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for the file (5 minutes expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 300);

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to generate signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate file URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate preview URL if available
    let previewUrl = null;
    if (file.preview_state === 'completed') {
      const previewPath = `${file.id}/preview.png`;
      const { data: previewData, error: previewError } = await supabase.storage
        .from('previews')
        .createSignedUrl(previewPath, 300);
      
      if (!previewError && previewData) {
        previewUrl = previewData.signedUrl;
      }
    }

    console.log(`Successfully fetched shared file: ${file.id}`);

    return new Response(
      JSON.stringify({
        file: {
          id: file.id,
          title: file.title,
          mime: file.mime,
          size: file.size,
          created_at: file.created_at,
        },
        signedUrl: signedUrlData.signedUrl,
        previewUrl: previewUrl,
        expiresAt: shareLink.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shared-file function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
