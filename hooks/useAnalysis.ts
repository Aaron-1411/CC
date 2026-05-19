'use client';
import { useState, useCallback, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAnalysis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track message history outside state so sendMessage closure can read it synchronously
  const historyRef = useRef<Message[]>([]);

  const sendMessage = useCallback(async (userContent: string, systemContext?: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setError(null);

    // Snapshot history before this turn, then append user message
    const prevHistory = historyRef.current;
    const newHistory: Message[] = [...prevHistory, { role: 'user', content: userContent }];
    historyRef.current = newHistory;
    setMessages([...newHistory, { role: 'assistant', content: '' }]);
    setStreaming(true);

    let assistantMsg = '';

    try {
      // Build messages array for the API — conversation history + current user message
      const apiMessages = [
        ...(systemContext ? [{ role: 'system' as const, content: systemContext }] : []),
        ...newHistory,
      ];

      const res = await fetch('/api/stream/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        let parsed: { error?: string } = {};
        try { parsed = JSON.parse(errText); } catch { /* ignore */ }
        throw new Error(parsed.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            if (raw === '[DONE]') continue;
            try {
              const chunk = JSON.parse(raw) as { text?: string; done?: boolean; error?: string };
              if (chunk.error) throw new Error(chunk.error);
              if (chunk.text) {
                assistantMsg += chunk.text;
                setMessages([
                  ...newHistory,
                  { role: 'assistant', content: assistantMsg },
                ]);
              }
            } catch (e) {
              if ((e as Error).message && !(e as Error).message.startsWith('Unexpected')) {
                throw e;
              }
            }
          }
        }
      }

      // Persist completed assistant message to history
      if (assistantMsg) {
        historyRef.current = [...newHistory, { role: 'assistant', content: assistantMsg }];
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        // Roll back to history before this turn
        historyRef.current = prevHistory;
        setMessages(prevHistory);
      }
    } finally {
      setStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    historyRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return { messages, streaming, error, sendMessage, clearMessages };
}
