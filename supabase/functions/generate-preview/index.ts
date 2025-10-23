import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PREVIEW_SIZE = 300; // Max width/height for thumbnails

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_id } = await req.json();

    if (!file_id) {
      throw new Error('file_id is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get file record
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', file_id)
      .single();

    if (fileError || !file) {
      throw new Error('File not found');
    }

    // Check if preview already exists
    const previewPath = `${file.owner_id}/${file_id}_preview.jpg`;
    const { data: existingPreview } = await supabase.storage
      .from('previews')
      .list(file.owner_id, {
        search: `${file_id}_preview`,
      });

    if (existingPreview && existingPreview.length > 0) {
      console.log(`Preview already exists for file ${file_id}`);
      
      // Get signed URL for existing preview
      const { data: signedData } = await supabase.storage
        .from('previews')
        .createSignedUrl(previewPath, 3600);

      return new Response(
        JSON.stringify({
          success: true,
          preview_url: signedData?.signedUrl,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only support images for now (PDF previews would require complex rendering)
    if (!file.mime.startsWith('image/')) {
      console.log(`Preview generation not supported for ${file.mime}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Preview only supported for images',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get signed URL for original file
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 300);

    if (signedError || !signedData) {
      throw new Error('Failed to get signed URL for original file');
    }

    // Download original image
    const imageResponse = await fetch(signedData.signedUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download original image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // For MVP: Store image as-is (could add resizing in future)
    const maxSize = 10 * 1024 * 1024; // 10MB max for preview storage
    
    let previewBuffer = imageBuffer;
    let previewMime = file.mime;
    
    if (imageBuffer.byteLength > maxSize) {
      console.warn(`Image too large (${imageBuffer.byteLength} bytes), storing original anyway`);
    }

    // Upload preview to storage
    const { error: uploadError } = await supabase.storage
      .from('previews')
      .upload(previewPath, previewBuffer, {
        contentType: previewMime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Preview upload error:', uploadError);
      throw new Error('Failed to upload preview');
    }

    // Update file record with preview state
    await supabase
      .from('files')
      .update({
        preview_state: 'ready',
        meta: {
          ...file.meta,
          preview_path: previewPath,
          preview_generated_at: new Date().toISOString(),
        },
      })
      .eq('id', file_id);

    // Get signed URL for new preview
    const { data: newSignedData } = await supabase.storage
      .from('previews')
      .createSignedUrl(previewPath, 3600);

    console.log(`Preview generated successfully for file ${file_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        preview_url: newSignedData?.signedUrl,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Preview generation error:', error);
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
