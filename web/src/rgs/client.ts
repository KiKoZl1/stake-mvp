import type { RoundPayload } from './types';

export type AuthResponse = {
  balance: number;
  currency?: string;
  minBet?: number;
  maxBet?: number;
  stepBet?: number;
  round?: { id?: string };
};

function requireParam(name: string) {
  const v = new URLSearchParams(location.search).get(name);
  if (!v) throw new Error(`Missing query param: ${name}`);
  return v;
}

export function getRgsUrl() {
  const url = new URLSearchParams(location.search).get('rgs_url');
  if (!url) throw new Error('Missing ?rgs_url=...');
  return url;
}

export async function authenticate() {
  const rgs = getRgsUrl();
  const sessionID = requireParam('sessionID');
  const res = await fetch(`${rgs}/wallet/authenticate`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ sessionID })
  });
  if (!res.ok) throw new Error('authenticate failed');
  return res.json() as Promise<AuthResponse>;
}

export async function play(payload: { bet: number; mode: string }) {
  const rgs = getRgsUrl();
  const res = await fetch(`${rgs}/play`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('play failed');
  return res.json() as Promise<{ round: RoundPayload }>;
}

export async function endRound(payload: { roundId?: string; totalWin: number }) {
  const rgs = getRgsUrl();
  const res = await fetch(`${rgs}/wallet/end-round`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('end-round failed');
  return res.json();
}
