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
    const { file_id, user_context } = await req.json();

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

    // Get user's locale preference for language-specific metadata generation
    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', file.owner_id)
      .single();
    
    const userLocale = profile?.locale || 'de';
    const languageInstruction = userLocale === 'de' 
      ? 'Provide all metadata (title, keywords, folder path) in German.'
      : 'Provide all metadata (title, keywords, folder path) in English.';

    // Add user context instruction if provided
    const userContextInstruction = user_context 
      ? `\n\nUSER PROVIDED CONTEXT: The user has indicated this document is related to: "${user_context}". Use this information as PRIMARY guidance for naming and organizing the document.`
      : '';

    // Get existing folder structure to ensure consistent organization
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('id, name, parent_id, meta')
      .eq('owner_id', file.owner_id);

    // Build a hierarchical representation of existing folders
    let folderStructureText = '';
    if (existingFolders && existingFolders.length > 0) {
      const buildFolderTree = (parentId: string | null = null, depth: number = 0): string => {
        const children = existingFolders.filter(f => f.parent_id === parentId);
        return children.map(folder => {
          const indent = '  '.repeat(depth);
          const metaInfo = folder.meta && Object.keys(folder.meta).length > 0 
            ? ` (${JSON.stringify(folder.meta)})` 
            : '';
          return indent + folder.name + metaInfo + '\n' + buildFolderTree(folder.id, depth + 1);
        }).join('');
      };
      
      folderStructureText = '\n\nEXISTING FOLDER STRUCTURE:\n' + buildFolderTree();
      folderStructureText += '\n\nCRITICAL FOLDER RULES:\n';
      folderStructureText += '1. ALWAYS reuse existing folders when they match the document content\n';
      folderStructureText += '2. NEVER create duplicate or similar folder names (e.g., "Katze" and "Katzen" are duplicates - use only one)\n';
      folderStructureText += '3. Use flexible folder depth (1-6 levels, ideally 3-4 levels)\n';
      folderStructureText += '4. Only create new folders if content clearly doesn\'t fit existing structure\n';
      folderStructureText += '5. Singular vs plural: be consistent with existing folder naming conventions';
    }

    // Check file type
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

    // Get LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // For PDFs and Office documents, extract text content first
    let extractedText = '';
    
    if (isPdf || isOffice) {
      console.log(`Extracting text content from ${isPdf ? 'PDF' : 'Office'} document: ${file.title}`);
      
      // Get signed URL for file download
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(file.storage_path, 300);

      if (signedError || !signedData) {
        throw new Error('Failed to get signed URL for text extraction');
      }

      // For Office documents (.docx), try to extract text using basic approach
      // For PDFs, we'll use OCR via Gemini's vision capabilities
      if (isOffice) {
        // For Office documents, we'll send the filename and ask AI to analyze based on it
        // This is a fallback since we can't easily extract .docx content in Deno
        console.log('Using filename-based analysis for Office document');
        extractedText = `Document filename: ${file.title}`;
      } else if (isPdf) {
        // For PDFs, we'll convert to base64 and send to Gemini for OCR
        console.log('Preparing PDF for OCR analysis');
        
        const fileResponse = await fetch(signedData.signedUrl);
        if (!fileResponse.ok) {
          throw new Error('Failed to download PDF file');
        }
        
        const fileBuffer = await fileResponse.arrayBuffer();
        const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
        
        // Use Gemini to extract text from PDF via OCR
        const ocrResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all text content from this PDF document. Return only the extracted text, nothing else.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${file.mime};base64,${base64Content}`,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!ocrResponse.ok) {
          const errorText = await ocrResponse.text();
          console.error('OCR extraction error:', ocrResponse.status, errorText);
          
          // Fallback to filename-based analysis if OCR fails
          console.log('OCR failed, falling back to filename analysis');
          extractedText = `Document filename: ${file.title}`;
        } else {
          const ocrData = await ocrResponse.json();
          extractedText = ocrData.choices?.[0]?.message?.content || `Document filename: ${file.title}`;
          console.log(`Extracted ${extractedText.length} characters from PDF`);
        }
      }
    }

    // Now analyze the document (image, PDF text, or Office doc)
    let contentPayload;
    let analysisPrompt = '';
    
    if (isImage) {
      // For images, pass a short-lived signed URL directly (avoid large base64 payloads)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(file.storage_path, 300);

      if (signedError || !signedData) {
        throw new Error('Failed to get signed URL for image');
      }

      analysisPrompt = `Analyze this image/document and extract: document type (e.g., invoice, receipt, letter, contract, photo, diagram), a suggested descriptive title (max 60 chars), 3-5 relevant keywords, and suggest an appropriate folder structure path with flexible depth (1-6 levels, ideally 3-4). AVOID duplicate or similar folder names (e.g., "Katze" and "Katzen"). REUSE existing folders whenever they match the content. ${languageInstruction}${userContextInstruction}${folderStructureText}`;

      contentPayload = [
        {
          type: 'text',
          text: analysisPrompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: signedData.signedUrl,
          },
        },
      ];
    } else {
      // For PDFs and Office docs, use extracted text
      analysisPrompt = `Analyze this document and extract metadata to help organize it intelligently.

Document: ${file.title}
${extractedText ? `Content preview: ${extractedText.substring(0, 2000)}` : ''}

Extract:
1. document_type: Type of document (invoice, receipt, letter, contract, report, presentation, spreadsheet, etc.)
2. suggested_title: A descriptive title (max 60 chars) based on content
3. keywords: 3-5 relevant keywords from the content
4. suggested_path: A logical folder structure path with flexible depth (1-6 levels, ideally 3-4). CRITICAL: AVOID duplicate or similar folder names (e.g., "Katze" and "Katzen" are duplicates). REUSE existing folders when they match the document content.

${languageInstruction}${userContextInstruction}${folderStructureText}`;

      contentPayload = analysisPrompt;
    }

    // Call Lovable AI Gateway
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
            content: 'You are an intelligent document filing assistant. Analyze documents and suggest metadata and folder structures for optimal organization.',
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
              description: 'Extract document metadata and suggest folder structure',
              parameters: {
                type: 'object',
                properties: {
                  document_type: {
                    type: 'string',
                    description: 'Type of document (invoice, receipt, letter, contract, report, etc.)',
                  },
                  suggested_title: {
                    type: 'string',
                    description: 'Descriptive title based on document content (max 60 characters)',
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of 3-5 relevant keywords from content',
                  },
                  suggested_path: {
                    type: 'string',
                    description: 'Suggested folder path with 1-6 levels (ideally 3-4). AVOID duplicates like "Katze" and "Katzen". REUSE existing folders when appropriate.',
                  },
                },
                required: ['document_type', 'suggested_title', 'keywords', 'suggested_path'],
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
        return new Response(
          JSON.stringify({
            error: 'AI rate limit exceeded. Please try again later.',
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'AI credits exhausted. Please add credits to your workspace.',
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`AI extraction failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No metadata extracted from AI response');
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Track usage
    await incrementUsageTracking(supabase, file.owner_id, 'smart_upload');

    console.log(`Smart upload completed for ${file.mime} file ${file_id}:`, extracted);

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
