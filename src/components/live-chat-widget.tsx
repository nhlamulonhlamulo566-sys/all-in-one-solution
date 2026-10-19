'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Bot, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  message_id: string;
  sender_id: string;
  sender_role: 'visitor' | 'staff';
  message_text: string;
  created_at: string;
};

type ApiError = { error?: string };

const AGENT_GREETING =
  'Hi there! Send us your question and our team will reply here as soon as possible.';
const TOKEN_STORAGE_KEY = 'chatVisitorToken';
const SESSION_STORAGE_KEY = 'chatSessionId';

function createVisitorToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorToken, setVisitorToken] = useState<string | null>(null);
  const [messagesData, setMessagesData] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token || !/^[A-Za-z0-9-]{40,100}$/.test(token)) {
      token = createVisitorToken();
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    setVisitorToken(token);
  }, []);

  const createSession = useCallback(async (token: string) => {
    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'X-Chat-Token': token },
    });
    const body = (await response.json()) as { sessionId?: string } & ApiError;
    if (!response.ok || !body.sessionId) {
      throw new Error(body.error || 'Unable to start a chat right now.');
    }
    localStorage.setItem(SESSION_STORAGE_KEY, body.sessionId);
    setSessionId(body.sessionId);
    setMessagesData([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!visitorToken || !isOpen) return;
    const token = visitorToken;
    const controller = new AbortController();

    async function restoreSession() {
      try {
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSessionId) {
          const response = await fetch(
            `/api/chat/sessions/${encodeURIComponent(storedSessionId)}/messages`,
            {
              headers: { 'X-Chat-Token': token },
              cache: 'no-store',
              signal: controller.signal,
            }
          );
          if (response.ok) {
            setSessionId(storedSessionId);
            return;
          }
          if (response.status !== 404) {
            const body = (await response.json()) as ApiError;
            throw new Error(body.error || 'Unable to restore your chat.');
          }
        }
        await createSession(token);
      } catch (sessionError) {
        if (controller.signal.aborted) return;
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : 'Unable to start a chat.'
        );
      }
    }

    void restoreSession();
    return () => controller.abort();
  }, [createSession, isOpen, visitorToken]);

  const refreshMessages = useCallback(async (
    token: string,
    currentSessionId: string,
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `/api/chat/sessions/${encodeURIComponent(currentSessionId)}/messages`,
      {
        headers: { 'X-Chat-Token': token },
        cache: 'no-store',
        signal,
      }
    );
    const body = (await response.json()) as { messages?: Message[] } & ApiError;
    if (!response.ok) throw new Error(body.error || 'Unable to load chat messages.');
    setMessagesData(body.messages ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen || !visitorToken || !sessionId) return;
    const controller = new AbortController();
    const refresh = () => {
      void refreshMessages(visitorToken, sessionId, controller.signal).catch(
        (refreshError) => {
          if (!controller.signal.aborted) {
            setError(
              refreshError instanceof Error
                ? refreshError.message
                : 'Unable to load chat messages.'
            );
          }
        }
      );
    };
    refresh();
    const interval = window.setInterval(refresh, 3000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [isOpen, refreshMessages, sessionId, visitorToken]);

  const messages = [
    {
      message_id: 'greeting',
      sender_id: 'agent',
      sender_role: 'staff' as const,
      message_text: AGENT_GREETING,
      created_at: '',
    },
    ...messagesData,
  ];

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || !visitorToken || !sessionId || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
        {
          method: 'POST',
          headers: {
            'X-Chat-Token': visitorToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: inputValue }),
        }
      );
      const body = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(body.error || 'Unable to send your message.');
      setInputValue('');
      await refreshMessages(visitorToken, sessionId);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send your message.'
      );
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const scrollableView = scrollAreaRef.current?.querySelector('div');
    scrollableView?.scrollTo({
      top: scrollableView.scrollHeight,
      behavior: 'smooth',
    });
  }, [messagesData]);

  return (
    <>
      <div
        className={cn(
          'fixed bottom-4 right-4 z-50 transition-transform duration-300 ease-in-out sm:bottom-6 sm:right-6',
          isOpen ? 'scale-0' : 'scale-100'
        )}
      >
        <Button
          className="h-14 rounded-full px-5 shadow-lg sm:h-16"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />
          <span>Chat with us</span>
        </Button>
      </div>

      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 h-full w-full transition-all duration-300 ease-in-out sm:bottom-6 sm:right-6 sm:h-[500px] sm:w-[350px]',
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-10 opacity-0'
        )}
      >
        <Card className="flex h-full w-full flex-col rounded-none shadow-2xl sm:rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              aria-label="Close live chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-4">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isVisitorMessage = message.sender_role === 'visitor';
                  return (
                    <div
                      key={message.message_id || index}
                      className={cn(
                        'flex items-end gap-2',
                        isVisitorMessage ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isVisitorMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] break-words rounded-2xl px-4 py-2 text-sm',
                          isVisitorMessage
                            ? 'rounded-br-none bg-primary text-primary-foreground'
                            : 'rounded-bl-none bg-secondary text-secondary-foreground'
                        )}
                      >
                        {message.message_text}
                      </div>
                      {isVisitorMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <UserIcon className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            {error && (
              <p role="status" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Type your message..."
                autoComplete="off"
                maxLength={2000}
                disabled={!visitorToken || !sessionId || isSending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={!visitorToken || !sessionId || isSending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
