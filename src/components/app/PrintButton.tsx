'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-outline print:hidden">
      <Printer size={16} /> Imprimer / PDF
    </button>
  );
}
