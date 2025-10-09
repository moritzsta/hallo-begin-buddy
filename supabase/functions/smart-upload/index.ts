import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_LIMITS = {
  free: 10,
  basic: 50,
  plus: 200,
  max: 999999,
};

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

    // Get user profile for plan tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', file.owner_id)
      .single();

    const planTier = (profile?.plan_tier || 'free') as keyof typeof PLAN_LIMITS;

    // Check usage limit for this month
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', file.owner_id)
      .eq('feature', 'smart_upload')
      .eq('date', today)
      .single();

    const currentCount = usage?.count || 0;
    if (currentCount >= PLAN_LIMITS[planTier]) {
      return new Response(
        JSON.stringify({
          error: 'Smart upload limit reached for your plan',
          limit: PLAN_LIMITS[planTier],
          current: currentCount,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only process images for now (PDF support can be added later)
    if (!file.mime.startsWith('image/')) {
      console.log(`Skipping non-image file: ${file.mime}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Smart upload only supports images currently',
          extracted: null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get signed URL for file
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 300);

    if (signedError || !signedData) {
      throw new Error('Failed to get signed URL');
    }

    // Download image as base64
    const imageResponse = await fetch(signedData.signedUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const imageDataUrl = `data:${file.mime};base64,${base64Image}`;

    // Call Lovable AI Gateway with Vision
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a document analysis assistant. Extract key information from documents to help users organize them.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this document image and extract: document type (e.g., invoice, receipt, letter, contract, photo), a suggested descriptive title (max 60 chars), and 3-5 relevant keywords.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_metadata',
              description: 'Extract document metadata from image',
              parameters: {
                type: 'object',
                properties: {
                  document_type: {
                    type: 'string',
                    description: 'Type of document (e.g., invoice, receipt, letter, contract, photo)',
                  },
                  suggested_title: {
                    type: 'string',
                    description: 'Descriptive title for the document (max 60 characters)',
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of 3-5 relevant keywords',
                  },
                  extracted_text: {
                    type: 'string',
                    description: 'Key text content from the document (first 500 chars)',
                  },
                },
                required: ['document_type', 'suggested_title', 'keywords'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_metadata' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      
      throw new Error('AI extraction failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No metadata extracted');
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Update file record with AI-extracted metadata
    const { error: updateError } = await supabase
      .from('files')
      .update({
        meta: {
          ...file.meta,
          ai_extracted: {
            document_type: extracted.document_type,
            suggested_title: extracted.suggested_title,
            keywords: extracted.keywords,
            extracted_text: extracted.extracted_text || '',
            extracted_at: new Date().toISOString(),
          },
        },
        // Optionally update tags with keywords
        tags: extracted.keywords || [],
      })
      .eq('id', file_id);

    if (updateError) {
      console.error('Failed to update file:', updateError);
    }

    // Track usage
    await supabase.from('usage_tracking').insert({
      user_id: file.owner_id,
      feature: 'smart_upload',
      date: today,
      count: 1,
    }).then(({ error }) => {
      if (error && error.code === '23505') {
        // Unique constraint violation - update instead
        return supabase
          .from('usage_tracking')
          .update({ count: currentCount + 1 })
          .eq('user_id', file.owner_id)
          .eq('feature', 'smart_upload')
          .eq('date', today);
      }
      return { error };
    });

    console.log(`Smart upload completed for file ${file_id}:`, extracted);

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Smart upload error:', error);
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
