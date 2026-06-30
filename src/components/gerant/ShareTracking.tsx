'use client';

import { useEffect, useState } from 'react';
import { whatsappHref } from '@/data/company';
import { Copy, Check, MessageCircle, QrCode } from 'lucide-react';

/** Partage du code de suivi au client (WhatsApp + copie du lien). */
export function ShareTracking({
  code,
  reference,
  from,
  to,
}: {
  code: string;
  reference: string;
  from: string;
  to: string;
}) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/suivi/${code}` : `/suivi/${code}`;
  const message = `Bonjour, suivez votre livraison ONE WAY ${reference} (${from} → ${to}) en temps réel : ${url}\nCode de suivi : ${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
      <div className="flex items-center gap-2 text-brand-700">
        <QrCode size={18} />
        <h3 className="text-sm font-bold">Code de suivi client</h3>
      </div>
      <p className="mt-2 select-all rounded-lg bg-white px-3 py-2 text-center text-lg font-extrabold tracking-widest text-ink">
        {code}
      </p>
      <p className="mt-1 break-all text-center text-[11px] text-ink-muted">{url}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={whatsappHref('', message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
        <button onClick={copy} className="btn-outline">
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          {copied ? 'Copié' : 'Copier le lien'}
        </button>
      </div>
    </div>
  );
}
