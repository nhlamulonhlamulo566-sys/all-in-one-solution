'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Send, User } from 'lucide-react';
import { useUser } from '@/auth/provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ChatSession = {
  session_id: string;
  visitor_id: string;
  created_at: string;
  status: 'active' | 'closed';
  last_message: string | null;
  last_message_at: string | null;
};

type ChatMessage = {
  message_id: string;
  sender_id: string;
  sender_role: 'visitor' | 'staff';
  message_text: string;
  created_at: string;
};

export default function ChatDashboard() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setIsLoading(false);
      setError('Sign in with an authorized staff account to view chats.');
      return;
    }
    try {
      const response = await fetch('/api/staff/chats', {
        cache: 'no-store',
        signal,
      });
      const body = (await response.json()) as { sessions?: ChatSession[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to load chat sessions.');
      const nextSessions = body.sessions ?? [];
      setSessions(nextSessions);
      setSelectedSessionId((current) =>
        current && nextSessions.some((session) => session.session_id === current)
          ? current
          : nextSessions[0]?.session_id ?? null
      );
      setError(null);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load chat sessions.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSessions(controller.signal);
    const interval = window.setInterval(() => {
      void loadSessions(controller.signal);
    }, 5000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadSessions]);

  const loadMessages = useCallback(async (
    sessionId: string,
    signal?: AbortSignal
  ) => {
    if (!user) return;
    try {
      const response = await fetch(
        `/api/staff/chats/${encodeURIComponent(sessionId)}`,
        {
          cache: 'no-store',
          signal,
        }
      );
      const body = (await response.json()) as { messages?: ChatMessage[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to load this conversation.');
      setMessages(body.messages ?? []);
      setError(null);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this conversation.');
    }
  }, [user]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }
    const controller = new AbortController();
    void loadMessages(selectedSessionId, controller.signal);
    const interval = window.setInterval(() => {
      void loadMessages(selectedSessionId, controller.signal);
    }, 3000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadMessages, selectedSessionId]);

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selectedSessionId || !reply.trim() || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/staff/chats/${encodeURIComponent(selectedSessionId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: reply }),
        }
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to send your reply.');
      setReply('');
      await loadMessages(selectedSessionId);
      await loadSessions();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send your reply.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading && sessions.length === 0) {
    return <p className="text-muted-foreground">Loading chat sessions...</p>;
  }

  if (error && sessions.length === 0) {
    return <p role="alert" className="text-destructive">Unable to load chats: {error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>No chat sessions yet. New visitor conversations appear here.</p>
        {error && <p role="status" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  const selectedSession = sessions.find(
    (session) => session.session_id === selectedSessionId
  );

  return (
    <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.5fr)]">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y">
            {sessions.map((session) => (
              <li key={session.session_id}>
                <button
                  type="button"
                  onClick={() => setSelectedSessionId(session.session_id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-secondary ${
                    selectedSessionId === session.session_id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-grow">
                      <p className="truncate font-semibold">Visitor {session.visitor_id.slice(0, 8)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {session.last_message || 'Started a chat'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(
                      parseISO(session.last_message_at || session.created_at),
                      { addSuffix: true }
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {selectedSession && (
        <Card className="flex min-h-[28rem] flex-col">
          <CardContent className="flex flex-1 flex-col p-4">
            <p className="mb-4 border-b pb-3 text-sm text-muted-foreground">
              Session {selectedSession.session_id} · {selectedSession.status}
            </p>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages in this conversation yet.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.message_id}
                  className={`flex ${message.sender_role === 'staff' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      message.sender_role === 'staff'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
                    <p className="mt-1 text-right text-[10px] opacity-70">
                      {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {error && <p role="status" className="mt-2 text-sm text-destructive">{error}</p>}
            <form onSubmit={sendReply} className="mt-4 flex gap-2 border-t pt-4">
              <Input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Reply to this visitor..."
                maxLength={2000}
                disabled={selectedSession.status !== 'active' || isSending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send reply"
                disabled={selectedSession.status !== 'active' || isSending || !reply.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
