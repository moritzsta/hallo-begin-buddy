# Communication & Realtime Pattern
**Kategorie:** Echtzeit-Kommunikation & Messaging  
**Verwendung in:** Handwerker Marketplace (Messaging), PromptManager (Realtime Updates)  
**Komplexität:** Hoch  
**Dependencies:** Supabase Realtime, PostgreSQL

---

## Überblick

Dieses Pattern beschreibt wiederverwendbare Kommunikations-Muster für:
- Messaging-Systeme (1:1, Gruppen)
- Realtime Updates (Database Changes)
- Presence Tracking (Online-Status)
- Benachrichtigungen (In-App, Push)
- Typing Indicators
- Read Receipts

---

## Architektur

### System-Übersicht
```
┌────────────────────────────────────────────────────┐
│              Supabase Realtime Layer               │
│  (WebSocket Connection, Channel Management)        │
└──────────────┬─────────────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
┌─────────┐ ┌──────┐ ┌──────────┐
│Messages │ │Change│ │ Presence │
│ Channel │ │ Feed │ │ Tracking │
└─────────┘ └──────┘ └──────────┘
```

---

## 1. Messaging System

### Use Case
- Chat zwischen Handwerkern und Kunden
- Projekt-bezogene Kommunikation
- Direkt-Nachrichten

### Datenbank-Schema

```sql
-- Conversations (1:1 oder Gruppen)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct', -- 'direct' | 'group' | 'project'
  title text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation Members (M:N)
CREATE TABLE public.conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX idx_conversation_members_conversation ON public.conversation_members(conversation_id);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text DEFAULT 'text', -- 'text' | 'image' | 'file' | 'system'
  attachments jsonb DEFAULT '[]',
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  
  CONSTRAINT valid_content CHECK (
    (type = 'text' AND length(content) > 0) OR
    (type != 'text')
  )
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- Read Receipts (optional)
CREATE TABLE public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  
  UNIQUE(message_id, user_id)
);

-- Function: Unread Count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_conversation_id uuid, p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_read_at timestamptz;
  v_count integer;
BEGIN
  -- Letzten Lesezeitpunkt holen
  SELECT last_read_at INTO v_last_read_at
  FROM public.conversation_members
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  -- Ungelesene Nachrichten zählen
  SELECT COUNT(*)::integer INTO v_count
  FROM public.messages
  WHERE conversation_id = p_conversation_id
    AND created_at > COALESCE(v_last_read_at, '1970-01-01'::timestamptz)
    AND sender_id != p_user_id
    AND deleted_at IS NULL;
  
  RETURN v_count;
END;
$$;

-- Trigger: Conversation Updated At aktualisieren
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
```

### RLS Policies

```sql
-- Conversations: Nur Members können sehen
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update conversations"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Messages: Nur Conversation-Members
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Sender can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Conversation Members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view participants"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );
```

### Realtime aktivieren

```sql
-- Realtime für Messages aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Optional: Auch für Typing Indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
```

### Frontend-Implementierung

**Custom Hook: useMessages**
```typescript
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useMessages = (conversationId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Nachrichten laden
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId
  });

  // Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Neue Nachricht zu Cache hinzufügen
          queryClient.setQueryData<Message[]>(
            ['messages', conversationId],
            (old = []) => [...old, payload.new as Message]
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Nachricht im Cache aktualisieren
          queryClient.setQueryData<Message[]>(
            ['messages', conversationId],
            (old = []) =>
              old.map(msg =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Nachricht senden
  const sendMessage = useMutation({
    mutationFn: async ({ content, type = 'text' }: { content: string; type?: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content,
          type
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Als gelesen markieren
  const markAsRead = async () => {
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user!.id);
  };

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    markAsRead
  };
};
```

**Chat Component:**
```typescript
import { useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const ChatWindow = ({ conversationId }: { conversationId: string }) => {
  const { messages, sendMessage, markAsRead } = useMessages(conversationId);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // Auto-Scroll zu neuester Nachricht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    markAsRead();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          const isOwn = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender?.avatar_url} />
                <AvatarFallback>
                  {message.sender?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                <div
                  className={`rounded-lg px-4 py-2 max-w-md ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(message.created_at).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nachricht schreiben..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

---

## 2. Presence Tracking (Online-Status)

### Use Case
- "Benutzer ist online" Anzeige
- "Tippt gerade..." Indicator
- Aktive Benutzer in Conversation

### Implementierung

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePresence = (conversationId: string) => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log(`User ${key} joined`);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log(`User ${key} left`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            full_name: profile?.full_name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return { onlineUsers };
};
```

**UI: Online Indicator**
```typescript
import { Badge } from '@/components/ui/badge';

export const OnlineIndicator = ({ userId, onlineUsers }: {
  userId: string;
  onlineUsers: string[];
}) => {
  const isOnline = onlineUsers.includes(userId);

  return (
    <div className="relative">
      <Avatar>
        {/* ... */}
      </Avatar>
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
      )}
    </div>
  );
};
```

---

## 3. Typing Indicators

### Datenbank-Schema (optional, für Persistence)

```sql
CREATE TABLE public.typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  typing_at timestamptz DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

-- Auto-Cleanup nach 10 Sekunden
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE typing_at < now() - interval '10 seconds';
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_typing_indicator_cleanup
  AFTER INSERT OR UPDATE ON public.typing_indicators
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_typing_indicators();
```

### Implementierung (Broadcast-basiert)

```typescript
export const useTypingIndicator = (conversationId: string) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers((prev) => {
          if (payload.userId === user?.id) return prev;
          if (prev.includes(payload.userId)) return prev;
          return [...prev, payload.userId];
        });

        // Nach 3 Sekunden entfernen
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const notifyTyping = () => {
    // Debounce: Nur alle 2 Sekunden senden
    if (timeoutRef.current) return;

    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user!.id, fullName: profile?.full_name },
    });

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
    }, 2000);
  };

  return { typingUsers, notifyTyping };
};
```

**UI Integration:**
```typescript
<Input
  value={input}
  onChange={(e) => {
    setInput(e.target.value);
    notifyTyping();
  }}
  placeholder="Nachricht schreiben..."
/>

{typingUsers.length > 0 && (
  <div className="text-sm text-muted-foreground">
    {typingUsers.length === 1
      ? `${typingUsers[0]} tippt...`
      : `${typingUsers.length} Personen tippen...`}
  </div>
)}
```

---

## 4. Benachrichtigungen

### Datenbank-Schema

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'message' | 'system' | 'mention'
  title text NOT NULL,
  body text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- Function: Benachrichtigung bei neuer Nachricht
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Benachrichtigungen für alle Conversation Members erstellen (außer Sender)
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT
    cm.user_id,
    'message',
    'Neue Nachricht',
    LEFT(NEW.content, 100),
    '/conversations/' || NEW.conversation_id
  FROM public.conversation_members cm
  WHERE cm.conversation_id = NEW.conversation_id
    AND cm.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();
```

### Frontend: Notification Center

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return { notifications, unreadCount, markAsRead: markAsRead.mutate };
};

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
```

---

## Best Practices

### Messaging
- **Pagination**: Lazy-Loading für alte Nachrichten (Virtualized Lists)
- **Optimistic Updates**: Nachricht sofort anzeigen, dann Server-Sync
- **Retry Logic**: Fehlgeschlagene Nachrichten erneut senden
- **Delete vs Soft-Delete**: `deleted_at` für Audit Trail

### Realtime
- **Channel Cleanup**: Immer `supabase.removeChannel()` in Cleanup
- **Reconnection Logic**: Automatisch bei WebSocket-Disconnect
- **Rate Limiting**: Max. 1 Typing-Event pro 2 Sekunden

### Presence
- **Heartbeat**: Presence-Update alle 30 Sekunden
- **Timeout**: User als "offline" nach 60 Sekunden ohne Update
- **Privacy**: Nur Presence in aktiven Conversations teilen

### Performance
- **Index auf (conversation_id, created_at)**: Schnelle Message-Queries
- **LIMIT Queries**: Nie alle Messages auf einmal laden
- **Broadcast vs Database**: Typing = Broadcast, Messages = Database

---

## Checkliste für Implementierung

- [ ] Conversations & Members Tabellen erstellt
- [ ] Messages Tabelle mit RLS Policies
- [ ] Realtime auf `messages` aktiviert
- [ ] `useMessages` Hook implementiert
- [ ] Chat-UI mit Auto-Scroll
- [ ] Presence Tracking eingerichtet
- [ ] Typing Indicators implementiert
- [ ] Notifications Tabelle + Trigger
- [ ] Notification Center UI
- [ ] Unread Count Badge
- [ ] Mark-as-Read Functionality
- [ ] WebSocket Error Handling
- [ ] Performance-Tests (100+ Messages)

---

## Häufige Fehler & Lösungen

**Problem:** Nachrichten werden doppelt angezeigt  
**Lösung:** Deduplizierung im Cache via `queryClient.setQueryData` mit ID-Check

**Problem:** Presence-Updates kommen nicht an  
**Lösung:** Channel-Key muss `user.id` sein, nicht nur beliebiger String

**Problem:** Typing Indicator verschwindet nicht  
**Lösung:** Timeout nach 3 Sekunden setzen + Cleanup bei Component Unmount

**Problem:** "Too many connections" Error  
**Lösung:** Channels bei Unmount entfernen: `supabase.removeChannel()`

---

## Querverweise
- → `01-Auth-Profile-Pattern.md` (User Profile für Sender)
- → `03-Security-Pattern.md` (RLS für Conversations)
- → `05-Datenstruktur-Pattern.md` (Hierarchische Conversations)
- → `08-File-Management-Pattern.md` (Attachments in Messages)
