# 14-Transactional-Email-Pattern

## Überblick

**Was:** React-basierte E-Mail-Templates mit Resend-Integration für transaktionale E-Mails.

**Wann verwenden:**
- Für Welcome-Emails, Passwort-Reset, Benachrichtigungen
- Bei Sharing-Notifications, Löschbestätigungen
- Für Changelog-Updates an Nutzer

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                 Transactional Email System                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │            _shared/email-config.ts       │               │
│  │  - EMAIL_CONFIG (Sender, Reply-To)       │               │
│  │  - Shared utilities                      │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │      Edge Function: send-xxx-email       │               │
│  │  - Resend Client                         │               │
│  │  - React Email Rendering                 │               │
│  │  - Error Handling & Logging              │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │   _templates/xxx-email.tsx               │               │
│  │  - @react-email/components               │               │
│  │  - Multi-language Support (DE/EN)        │               │
│  │  - Inline Styles                         │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Email Configuration

```typescript
// supabase/functions/_shared/email-config.ts
export const EMAIL_CONFIG = {
  SENDER_NAME: 'AllMyPrompts',
  SENDER_EMAIL: 'noreply@allmyprompts.de',
  FORMATTED_SENDER: 'AllMyPrompts <noreply@allmyprompts.de>',
  REPLY_TO: 'support@allmyprompts.de',
  DASHBOARD_URL: 'https://allmyprompts.de/dashboard',
  SUPPORT_URL: 'https://allmyprompts.de/contact',
  UNSUBSCRIBE_URL: 'https://allmyprompts.de/settings',
};
```

### Schritt 2: React Email Template

```typescript
// supabase/functions/send-welcome-email/_templates/welcome-email.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  username: string;
  email: string;
  dashboardUrl: string;
  language?: 'de' | 'en';
}

export const WelcomeEmail = ({
  username,
  email,
  dashboardUrl,
  language = 'de',
}: WelcomeEmailProps) => {
  // Mehrsprachige Inhalte
  const content = {
    de: {
      preview: 'Willkommen bei AllMyPrompts!',
      greeting: `Hallo ${username}!`,
      welcome: 'Willkommen bei AllMyPrompts',
      intro: 'Wir freuen uns, dass du dich bei AllMyPrompts registriert hast!',
      trialInfo: 'Du hast jetzt Zugang zu deiner 7-tägigen kostenlosen Testphase.',
      features: 'Was du jetzt tun kannst:',
      feature1: '✨ Erstelle und verwalte unbegrenzt viele Prompts',
      feature2: '📁 Organisiere deine Prompts in Ordnern',
      feature3: '🤝 Teile Prompts und Ordner mit anderen',
      feature4: '🤖 Nutze KI-Features zur Prompt-Verbesserung',
      cta: 'Zum Dashboard',
      support: 'Brauchst du Hilfe?',
      supportText: 'Unser Support-Team steht dir jederzeit zur Verfügung.',
      contactUs: 'Kontaktiere uns',
      footer: 'AllMyPrompts - Dein Prompt Manager',
    },
    en: {
      preview: 'Welcome to AllMyPrompts!',
      greeting: `Hello ${username}!`,
      welcome: 'Welcome to AllMyPrompts',
      intro: 'We\'re excited that you\'ve signed up for AllMyPrompts!',
      trialInfo: 'You now have access to your 7-day free trial.',
      features: 'What you can do now:',
      feature1: '✨ Create and manage unlimited prompts',
      feature2: '📁 Organize your prompts in folders',
      feature3: '🤝 Share prompts and folders with others',
      feature4: '🤖 Use AI features to improve your prompts',
      cta: 'Go to Dashboard',
      support: 'Need help?',
      supportText: 'Our support team is always here for you.',
      contactUs: 'Contact us',
      footer: 'AllMyPrompts - Your Prompt Manager',
    },
  };

  const t = content[language];

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.welcome}</Heading>
          
          <Text style={greeting}>{t.greeting}</Text>
          <Text style={text}>{t.intro}</Text>
          
          <Section style={highlightBox}>
            <Text style={highlightText}>{t.trialInfo}</Text>
          </Section>
          
          <Text style={text}>{t.features}</Text>
          <Text style={featureText}>{t.feature1}</Text>
          <Text style={featureText}>{t.feature2}</Text>
          <Text style={featureText}>{t.feature3}</Text>
          <Text style={featureText}>{t.feature4}</Text>
          
          <Section style={buttonContainer}>
            <Link href={dashboardUrl} style={button}>
              {t.cta}
            </Link>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={supportHeading}>{t.support}</Text>
          <Text style={text}>{t.supportText}</Text>
          <Link href="mailto:support@allmyprompts.de" style={link}>
            {t.contactUs}
          </Link>
          
          <Hr style={hr} />
          
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Inline Styles (erforderlich für E-Mail-Kompatibilität)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '40px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
};

const greeting = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 20px',
  padding: '0 48px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 48px',
};

const featureText = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0',
  padding: '0 48px 0 68px',
};

const highlightBox = {
  backgroundColor: '#f0f7ff',
  border: '1px solid #0066ff',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '16px 24px',
};

const highlightText = {
  color: '#0066ff',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0',
};

const buttonContainer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0066ff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
};

const supportHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0 8px',
  padding: '0 48px',
};

const link = {
  color: '#0066ff',
  fontSize: '16px',
  textDecoration: 'underline',
  padding: '0 48px',
  display: 'block',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
  fontWeight: '600',
};
```

### Schritt 3: Edge Function für Email-Versand

```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { WelcomeEmail } from './_templates/welcome-email.tsx';
import { EMAIL_CONFIG } from '../_shared/email-config.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  username: string;
  language?: 'de' | 'en';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, language = 'de' }: WelcomeEmailRequest = await req.json();

    console.log(`📧 Sending welcome email to ${email} (${language})`);

    // React Email rendern
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        username,
        email,
        dashboardUrl: EMAIL_CONFIG.DASHBOARD_URL,
        language,
      })
    );

    // E-Mail senden
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.FORMATTED_SENDER,
      to: [email],
      subject: language === 'de' 
        ? 'Willkommen bei AllMyPrompts!' 
        : 'Welcome to AllMyPrompts!',
      html,
      replyTo: EMAIL_CONFIG.REPLY_TO,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Welcome email sent:', data?.id);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Schritt 4: Email-Typen und Templates

```typescript
// Typische E-Mail-Templates:

// 1. Welcome Email (Registrierung)
// supabase/functions/send-welcome-email/

// 2. Share Notification (Prompt/Folder geteilt)
// supabase/functions/send-share-notification/

// 3. Deletion Confirmation (Account-Löschung geplant)
// supabase/functions/send-deletion-confirmation/

// 4. Deletion Cancelled (Account-Löschung storniert)
// supabase/functions/send-deletion-cancelled/

// 5. Password Changed
// supabase/functions/send-password-changed/

// 6. Changelog Update
// supabase/functions/send-changelog-email/
```

### Schritt 5: Email-Aufruf aus anderem Code

```typescript
// Aus einer anderen Edge Function oder direkt:
await supabase.functions.invoke('send-welcome-email', {
  body: {
    email: user.email,
    username: profile.username || user.email.split('@')[0],
    language: 'de',
  },
});

// Oder aus Frontend (mit Auth):
const { data, error } = await supabase.functions.invoke('send-share-notification', {
  body: {
    recipientEmail: 'nutzer@example.com',
    senderName: 'Max Mustermann',
    resourceType: 'prompt',
    resourceName: 'Mein toller Prompt',
  },
});
```

---

## Best Practices

1. **Inline Styles:** E-Mail-Clients unterstützen kein externes CSS
2. **Fallback Text:** Immer Plain-Text-Version mitliefern
3. **Responsive Tables:** Für komplexe Layouts Tabellen statt Flexbox
4. **Mehrsprachigkeit:** Sprache als Parameter übergeben
5. **Logging:** Alle E-Mails mit Message-ID loggen
6. **Rate Limiting:** Resend hat Limits, entsprechend behandeln
7. **Error Handling:** E-Mail-Fehler nicht die Hauptaktion blockieren lassen

---

## Email-Template-Struktur

```
supabase/functions/
├── _shared/
│   └── email-config.ts           # Shared config
├── send-welcome-email/
│   ├── index.ts                  # Edge Function
│   └── _templates/
│       └── welcome-email.tsx     # React Template
├── send-share-notification/
│   ├── index.ts
│   └── _templates/
│       └── share-notification.tsx
└── send-deletion-confirmation/
    ├── index.ts
    └── _templates/
        └── deletion-confirmation.tsx
```

---

## Checkliste

- [ ] Resend Account erstellt und API Key in Secrets
- [ ] Domain bei Resend verifiziert
- [ ] _shared/email-config.ts erstellt
- [ ] React Email Templates für jeden E-Mail-Typ
- [ ] Edge Functions für jeden E-Mail-Typ
- [ ] Mehrsprachige Inhalte (DE/EN)
- [ ] Error Handling und Logging
- [ ] Alle Templates getestet (Resend Preview)

---

## Querverweise

- **01-Auth-Profile-Pattern:** Welcome Email bei Registrierung
- **08-Advanced-Sharing-Pattern:** Share Notifications
- **12-Account-Deletion-Pattern:** Deletion Emails

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
