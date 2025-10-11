# KI-Integration Pattern
**Kategorie:** AI & Machine Learning  
**Verwendung in:** Smarte Dokumentenablage (Smart Upload), PromptManager (Smart Improve)  
**Komplexität:** Hoch  
**Dependencies:** OpenAI API, Tesseract (optional), Edge Functions

---

## Überblick

Dieses Pattern beschreibt die Integration von KI-Features in Supabase-basierte Anwendungen:
- **Smart Upload:** OCR + KI-Metadaten-Extraktion
- **Smart Improve:** Kontextuelle Prompt-Verbesserung mit Rückfragen
- **Kostenoptimierung:** Caching, kurze Prompts, Response-Limits
- **Rate Limiting:** Schutz vor Missbrauch und Kostenexplosion

---

## Architektur

### System-Übersicht
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Edge Function  │────▶│  OpenAI API     │
│  (Upload/Edit)  │     │  (Koordinator)  │     │  (GPT-4o-mini)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        
                                │                        
                                ▼                        
                      ┌─────────────────┐               
                      │  OCR Service    │               
                      │  (Tesseract)    │               
                      └─────────────────┘               
                                │
                                │
                                ▼
                      ┌─────────────────┐
                      │  Usage Tracking │
                      │  + Limits       │
                      └─────────────────┘
```

---

## Use Case 1: Smart Upload (Dokumentenablage)

### Zweck
Automatische Extraktion von Metadaten aus hochgeladenen Dokumenten mittels OCR + KI.

### Workflow
1. User lädt Datei hoch
2. Backend extrahiert Text von Seite 1 (Tesseract OCR)
3. OpenAI analysiert Text → Metadaten + Titel
4. System schlägt Ablagepfad vor
5. User bestätigt → Datei wird abgelegt

### Implementierung

**Edge Function: smart-upload-classify.ts**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import Tesseract from 'https://esm.sh/tesseract.js@5.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    // Plan & Usage Check
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single();

    const planTier = profile?.plan_tier || 'free';

    // Check Smart Upload Limit (siehe Subscription Pattern)
    const limitCheck = await checkSmartUploadLimit(supabase, user.id, planTier);
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'limit_exceeded', 
          message: limitCheck.message 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse Request
    const { fileBuffer, fileName, mimeType } = await req.json();
    
    // OCR nur für PDFs und Bilder
    let extractedText = '';
    if (mimeType.includes('pdf') || mimeType.includes('image')) {
      // Tesseract OCR auf Seite 1
      const { data: { text } } = await Tesseract.recognize(
        fileBuffer,
        'deu+eng',
        { logger: m => console.log(m) }
      );
      extractedText = text.substring(0, 2000); // Max 2000 Zeichen
    }

    // OpenAI Metadaten-Extraktion
    const prompt = `
Analysiere den folgenden Text aus einem Dokument und extrahiere strukturierte Metadaten im JSON-Format.

Text:
"""
${extractedText}
Dateiname: ${fileName}
"""

Extrahiere:
- doc_type: Art des Dokuments (z.B. "rechnung", "vertrag", "brief", "formular")
- date: Datum im Format YYYY-MM-DD (oder null)
- party: Name der Gegenpartei/Absender (oder null)
- amount: Betrag in Euro (nur Zahl, oder null)
- confidence: Deine Konfidenz 0-100

Antworte NUR mit JSON, keine Erklärungen:
{
  "doc_type": "...",
  "date": "...",
  "party": "...",
  "amount": ...,
  "confidence": ...
}
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du bist ein Experte für Dokumentenanalyse.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const metadata = JSON.parse(content);

    // Titelvorschlag generieren
    const titlePrompt = `
Erstelle einen kurzen, prägnanten Datei-Titel für:
- Typ: ${metadata.doc_type}
- Partei: ${metadata.party || 'unbekannt'}
- Datum: ${metadata.date || 'unbekannt'}

Maximal 50 Zeichen, kein Präfix/Suffix.
`.trim();

    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: titlePrompt }
        ],
        max_tokens: 50,
        temperature: 0.5,
      }),
    });

    const titleData = await titleResponse.json();
    const suggestedTitle = titleData.choices[0].message.content.trim();

    // Pfadvorschlag basierend auf Schema
    const date = metadata.date ? new Date(metadata.date) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const suggestedPath = `/${metadata.doc_type}/${year}/${month}`;

    // Usage Tracking
    await incrementUsageTracking(supabase, user.id, 'smart_upload');

    return new Response(
      JSON.stringify({
        metadata: {
          ...metadata,
          title: suggestedTitle,
        },
        suggestedPath,
        extractedText: extractedText.substring(0, 500), // Preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

**Kostenoptimierung:**
- Nur Seite 1 OCR (nicht ganzes Dokument)
- Max 2000 Zeichen für Prompt
- `temperature: 0.3` für konsistente Ergebnisse
- `max_tokens: 300` für Metadaten, `50` für Titel
- Caching von häufigen Dokumenttypen (optional)

---

## Use Case 2: Smart Improve (PromptManager)

### Zweck
Intelligente Verbesserung von KI-Prompts durch kontextuelle Rückfragen.

### Workflow (2-Phasen)
1. **Phase 1: Rückfragen**
   - User klickt "Smart Improve"
   - KI analysiert Prompt → stellt 3-5 Rückfragen
   - User beantwortet Fragen

2. **Phase 2: Verbesserung**
   - KI generiert verbesserten Prompt basierend auf Antworten
   - User kann akzeptieren oder ablehnen

### Implementierung

**Edge Function: smart-improve-questions.ts**
```typescript
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth & Limit Check (wie oben)
    const { promptId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization')!;
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    // Prompt laden
    const { data: prompt } = await supabase
      .from('prompts')
      .select('title, description, content, category_key')
      .eq('id', promptId)
      .single();

    // KI-Rückfragen generieren
    const systemPrompt = `
Du bist ein Experte für KI-Prompt-Engineering. 
Analysiere den gegebenen Prompt und stelle 3-5 präzise Rückfragen, 
um den Prompt zu verbessern.

Fokus:
- Klarheit und Spezifität
- Zielgruppe und Kontext
- Output-Format und Stil
- Constraints und Anforderungen

Antworte im JSON-Format:
{
  "questions": [
    { "id": 1, "question": "Frage 1?" },
    { "id": 2, "question": "Frage 2?" },
    ...
  ]
}
`.trim();

    const userPrompt = `
Prompt-Titel: ${prompt.title}
Kategorie: ${prompt.category_key}
Beschreibung: ${prompt.description || 'keine'}

Prompt-Inhalt:
"""
${prompt.content}
"""
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return new Response(
      JSON.stringify({ questions: result.questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart improve questions error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

**Edge Function: smart-improve-generate.ts**
```typescript
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptId, answers } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization')!;
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    // Prompt laden
    const { data: prompt } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    // Antworten formatieren
    const answersText = answers
      .map((a: any) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    // Verbesserter Prompt generieren
    const systemPrompt = `
Du bist ein Experte für KI-Prompt-Engineering.
Verbessere den gegebenen Prompt basierend auf den Rückfragen-Antworten.

Prinzipien:
- Klare, präzise Sprache
- Strukturierte Anweisungen
- Explizite Output-Formate
- Relevante Constraints
- Zielgruppen-gerechter Ton

Gib NUR den verbesserten Prompt zurück, keine Erklärungen.
`.trim();

    const userPrompt = `
Original-Prompt:
"""
${prompt.content}
"""

Rückfragen & Antworten:
${answersText}

Verbessere jetzt den Prompt.
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const improvedContent = data.choices[0].message.content.trim();

    // Usage Tracking
    await incrementUsageTracking(supabase, user.id, 'smart_improve');

    return new Response(
      JSON.stringify({ improvedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart improve generate error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## Kostenoptimierung

### 1. Token-Limits
```typescript
const TOKEN_LIMITS = {
  metadata_extraction: 300,
  title_generation: 50,
  questions_generation: 500,
  prompt_improvement: 1500,
};
```

### 2. Prompt-Kompression
- Nur relevante Textausschnitte
- Kürzere System-Prompts
- Strukturierte Ausgaben (JSON)

### 3. Caching (optional)
```typescript
// Häufige Dokumenttypen cachen
const METADATA_CACHE: Map<string, any> = new Map();

const cacheKey = `${doc_type}_${first_100_chars_hash}`;
if (METADATA_CACHE.has(cacheKey)) {
  return METADATA_CACHE.get(cacheKey);
}

// ... OpenAI Call ...

METADATA_CACHE.set(cacheKey, result);
```

### 4. Rate Limiting
```typescript
// Cooldown zwischen Requests
const COOLDOWN_MS = {
  free: 60000, // 1 Min
  basic: 30000, // 30 Sek
  plus: 10000, // 10 Sek
  max: 0, // Kein Cooldown
};

// Last Request Tracking
const { data: lastUsage } = await supabase
  .from('usage_tracking')
  .select('updated_at')
  .eq('user_id', user.id)
  .eq('feature', 'smart_improve')
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();

const cooldown = COOLDOWN_MS[planTier];
const timeSinceLastRequest = Date.now() - new Date(lastUsage.updated_at).getTime();

if (timeSinceLastRequest < cooldown) {
  const waitTime = Math.ceil((cooldown - timeSinceLastRequest) / 1000);
  return { error: `Please wait ${waitTime} seconds before next request` };
}
```

---

## Best Practices

### Security
- API-Keys nur in Edge Functions
- User Auth vor jedem KI-Call
- Plan/Usage Checks vor teuren Operationen

### Performance
- Asynchrone Verarbeitung für lange Requests
- Timeout für OpenAI Calls (30s)
- Fallback bei Fehlern

### UX
- Loading-States während KI-Verarbeitung
- Preview von extrahiertem Text
- Editable AI-Vorschläge

### Kosten
- Monitoring der OpenAI-Kosten
- Alerts bei Anomalien
- Budget-Limits pro User/Plan

---

## Checkliste

- [ ] OpenAI API Key als Secret
- [ ] Edge Functions deployed
- [ ] Usage Tracking integriert
- [ ] Rate Limiting implementiert
- [ ] Token-Limits gesetzt
- [ ] Error Handling mit Fallbacks
- [ ] Loading States im UI
- [ ] Kosten-Monitoring aktiv
- [ ] Cooldowns konfiguriert

---

## Querverweise
- → `02-Subscription-Feature-Gating-Pattern.md` (Usage Limits)
- → `03-Security-Pattern.md` (API Security)
