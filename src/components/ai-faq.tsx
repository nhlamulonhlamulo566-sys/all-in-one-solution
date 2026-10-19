
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, Send } from 'lucide-react';

type AiFaqProps = {
  serviceDetails: string;
};

export default function AiFaq({ serviceDetails }: AiFaqProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;

    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch('/api/ai/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceDetails, question }),
        });
        const result = (await response.json()) as { answer?: string; error?: string };
        if (!response.ok || !result.answer) {
          throw new Error(result.error || 'Unable to answer that question right now.');
        }
        setAnswer(result.answer);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to answer that question right now.'
        );
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Have a question about this service? Ask our AI assistant!
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What technology do you use?"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending} size="icon">
            {isPending ? (
               <Bot className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Ask question</span>
          </Button>
        </form>
        {isPending && (
          <div className="flex items-center gap-2 text-muted-foreground p-4 bg-secondary rounded-lg">
            <Bot className="w-5 h-5 animate-pulse" />
            <p>Thinking...</p>
          </div>
        )}
        {answer && !isPending && (
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary rounded-full flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="flex-1 pt-1 text-secondary-foreground whitespace-pre-line">
                {answer}
              </p>
            </div>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
