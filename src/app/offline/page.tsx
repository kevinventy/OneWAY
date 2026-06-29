import { LogoMark } from '@/components/brand/Logo';

export const metadata = { title: 'Hors ligne — ONE WAY' };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <LogoMark className="h-16 w-16" />
      <h1 className="text-xl font-bold text-ink">Vous êtes hors ligne</h1>
      <p className="max-w-sm text-ink-muted">
        Impossible de joindre ONE WAY pour le moment. Vérifiez votre connexion — vos pages déjà
        consultées restent accessibles.
      </p>
      <a href="/" className="btn-primary">Réessayer</a>
    </div>
  );
}
