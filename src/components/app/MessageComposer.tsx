'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';

export function MessageComposer({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, body }),
      });
      setBody('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={send} className="flex items-center gap-2">
      <input className="input flex-1" placeholder="Écrire un message…" value={body} onChange={(e) => setBody(e.target.value)} />
      <button className="btn-primary" disabled={loading || !body.trim()}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  );
}
