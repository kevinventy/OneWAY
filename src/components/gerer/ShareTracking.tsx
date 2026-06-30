'use client';

import { useState } from 'react';
import { Copy, Check, MessageCircle, ExternalLink } from 'lucide-react';

/** Partage du code de suivi au client : copier le lien ou envoyer sur WhatsApp. */
export function ShareTracking({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/suivi/${code}`;

  function url() {
    return typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponible */
    }
  }

  function whatsapp() {
    const text = `Bonjour, suivez votre livraison One Way en temps réel : ${url()} (code ${code})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div>
      <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-lg font-bold tracking-wider text-ink">{code}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={copy} className="btn-outline">
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          {copied ? 'Copié' : 'Copier le lien'}
        </button>
        <button onClick={whatsapp} className="btn-outline text-emerald-700">
          <MessageCircle size={15} /> WhatsApp
        </button>
      </div>
      <a href={path} target="_blank" className="btn-ghost mt-2 w-full text-sm" rel="noreferrer">
        <ExternalLink size={14} /> Ouvrir la page client
      </a>
    </div>
  );
}
