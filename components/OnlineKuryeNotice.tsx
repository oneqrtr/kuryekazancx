'use client';

import { useEffect, useState } from 'react';

/** Avrupa/İstanbul saatine göre yoğunluk bandı (gösterilen sayı dekoratif / tahminidir). */
function getIstanbulHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value;
  return h != null ? parseInt(h, 10) : 12;
}

function randomInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Gece düşük, öğle/akşam yüksek bantlar */
function bandForHour(h: number): [number, number] {
  if (h >= 0 && h < 5) return [6, 24];
  if (h < 8) return [14, 42];
  if (h < 11) return [32, 68];
  if (h < 14) return [78, 148];
  if (h < 17) return [48, 96];
  if (h < 21) return [82, 172];
  return [20, 52];
}

export function OnlineKuryeNotice({ className = '' }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const h = getIstanbulHour(new Date());
    const [lo, hi] = bandForHour(h);
    setCount(randomInclusive(lo, hi));
  }, []);

  if (count === null) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-900 border border-emerald-100 ${className}`}
        aria-hidden
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="tabular-nums opacity-60">…</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-900 border border-emerald-100 shadow-sm ${className}`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span>
        Şu anda bu sayfada yaklaşık <strong className="tabular-nums font-semibold">{count}</strong> kurye
        hesaplama yapıyor
      </span>
    </div>
  );
}
