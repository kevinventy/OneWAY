import { redirect } from 'next/navigation';

/** L'aperçu est devenu la page d'accueil — on redirige pour garder les anciens liens. */
export default function ApercuRedirect() {
  redirect('/');
}
