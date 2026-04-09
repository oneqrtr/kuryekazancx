'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { PlatformPseoBlock } from '@/lib/pseo/platformParagraphs';
import { getCityPlatformPseoBlocks } from '@/lib/pseo/platformParagraphs';
import type { PlatformSlug } from '@/lib/kuryeKazancIndex';
import { getCityNameBySlug, validateCitySlug } from '@/lib/kuryeKazancIndex';

const STORAGE_KEY = 'kurye_last_city_slug';

export function PlatformPseoDynamicBlocks({
  platformKey,
  initialBlocks,
  urlCitySlug,
  children,
}: {
  platformKey: PlatformSlug;
  initialBlocks: PlatformPseoBlock;
  urlCitySlug: string | null;
  children: ReactNode;
}) {
  const [blocks, setBlocks] = useState(initialBlocks);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  useEffect(() => {
    if (urlCitySlug) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const slug = validateCitySlug(raw);
      const name = slug ? getCityNameBySlug(slug) : null;
      if (name) setBlocks(getCityPlatformPseoBlocks(name, platformKey));
    } catch {
      /* ignore */
    }
  }, [platformKey, urlCitySlug]);

  return (
    <>
      <div className="text-base text-gray-600 mb-8 max-w-3xl mx-auto space-y-4 text-left">
        <p>{blocks.paragraphs[0]}</p>
        <p>{blocks.paragraphs[1]}</p>
      </div>
      {children}
      <div className="mt-16 max-w-3xl mx-auto text-left bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{blocks.sectionTitle}</h2>
        <p className="text-gray-600 leading-relaxed">{blocks.sectionBody}</p>
      </div>
    </>
  );
}
