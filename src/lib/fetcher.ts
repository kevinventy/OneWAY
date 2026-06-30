/** Petits helpers fetch côté client (réponses { ok, data } de l'API). */

async function parse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || 'Erreur réseau, réessayez');
  }
  return json.data;
}

export async function apiPost<T = any>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parse(res);
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  return parse(res);
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  return parse(res);
}
