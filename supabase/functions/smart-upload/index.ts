import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import {
  getUserPlanTier,
  checkSmartUploadLimit,
  incrementUsageTracking,
} from '../_shared/plan-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user's plan tier and check smart upload limit
    const planTier = await getUserPlanTier(supabase, file.owner_id);
    const limitCheck = await checkSmartUploadLimit(supabase, file.owner_id, planTier);

    if (!limitCheck.allowed) {
      console.log(`Smart upload limit reached for user ${file.owner_id}: ${limitCheck.current}/${limitCheck.limit}`);
      return new Response(
        JSON.stringify({
          error: limitCheck.error,
          plan_tier: limitCheck.planTier,
          limit: limitCheck.limit,
          current: limitCheck.current,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Support images and PDFs
    const isImage = file.mime.startsWith('image/');
    const isPdf = file.mime === 'application/pdf';
    const isOffice = file.mime.includes('officedocument') || 
                     file.mime.includes('msword') || 
                     file.mime.includes('ms-excel') || 
                     file.mime.includes('ms-powerpoint');
    
    if (!isImage && !isPdf && !isOffice) {
      console.log(`Skipping unsupported file type: ${file.mime}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dieser Dateityp wird für Smart Upload nicht unterstützt. Nur Bilder, PDFs und Office-Dokumente werden analysiert.',
          extracted: null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For Office documents, use filename-based analysis as fallback
    if (isOffice) {
      console.log(`Processing Office document: ${file.title}`);
      
      // Extract info from filename
      const fileExt = file.title.split('.').pop()?.toLowerCase() || '';
      let docType = 'document';
      
      if (fileExt === 'docx' || fileExt === 'doc') {
        docType = 'document';
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        docType = 'spreadsheet';
      } else if (fileExt === 'pptx' || fileExt === 'ppt') {
        docType = 'presentation';
      }

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      // Use AI to suggest title and keywords based on filename
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
              content: 'You are a document analysis assistant. Based on filename, suggest a descriptive title and relevant keywords.',
            },
            {
              role: 'user',
              content: `Analyze this Office document filename: "${file.title}". Extract: document type (document, spreadsheet, presentation, report, template), a suggested descriptive title (max 60 chars), and 3-5 relevant keywords.`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_metadata',
                description: 'Extract document metadata from filename',
                parameters: {
                  type: 'object',
                  properties: {
                    document_type: {
                      type: 'string',
                      description: 'Type of document (document, spreadsheet, presentation, report, template)',
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
        console.error('AI Gateway error for Office doc:', aiResponse.status, errorText);
        
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
      
      if (toolCall) {
        const extracted = JSON.parse(toolCall.function.arguments);

        // Track usage
        await incrementUsageTracking(supabase, file.owner_id, 'smart_upload');

        console.log(`Smart upload completed for Office file ${file_id}:`, extracted);

        return new Response(
          JSON.stringify({
            success: true,
            extracted,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get signed URL for file
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 300);

    if (signedError || !signedData) {
      throw new Error('Failed to get signed URL');
    }

    // Download file content
    const fileResponse = await fetch(signedData.signedUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }
    
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    // Build content based on file type
    let contentPayload;
    if (isImage) {
      // For images, use image_url
      contentPayload = [
        {
          type: 'text',
          text: 'Analyze this document and extract: document type (e.g., invoice, receipt, letter, contract, photo, diagram), a suggested descriptive title (max 60 chars), and 3-5 relevant keywords.',
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${file.mime};base64,${base64Content}`,
          },
        },
      ];
    } else if (isPdf) {
      // For PDFs, we send the first page or text extraction request
      contentPayload = [
        {
          type: 'text',
          text: `Analyze this PDF document (filename: ${file.title}) and extract: document type (e.g., invoice, receipt, letter, contract, report), a suggested descriptive title (max 60 chars), and 3-5 relevant keywords. Use the filename and context to infer document type if needed.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${file.mime};base64,${base64Content}`,
          },
        },
      ];
    }

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
            content: 'You are a document analysis assistant. Extract key information from documents (images and PDFs) to help users organize them.',
          },
          {
            role: 'user',
            content: contentPayload,
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
    await incrementUsageTracking(supabase, file.owner_id, 'smart_upload');

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
