'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  INDEX_CITIES,
  INDEX_PLATFORMS,
  buildKazancToolUrl,
} from '@/lib/kuryeKazancIndex';

export function KuryeKazancIndexSection() {
  const [selectedCity, setSelectedCity] = useState<{ slug: string; name: string } | null>(null);

  return (
    <section className="mt-16 md:mt-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Kurye kazanç hesaplama
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Şehir ve platform seçerek doğrudan hesaplama aracına gidin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {/* 1. Şehir seç */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="flex w-7 h-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              1
            </span>
            Şehir seç
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Hesaplamak istediğiniz ili seçin (isteğe bağlı).
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 p-2">
            <div className="flex flex-wrap gap-2">
              {INDEX_CITIES.map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    try {
                      localStorage.setItem('kurye_last_city_slug', city.slug);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCity?.slug === city.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Platform seç → /kurye-kazanc-hesaplama */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="flex w-7 h-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              2
            </span>
            Platform seç
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Hesaplama aracına gideceksiniz.
          </p>
          <div className="space-y-3">
            {INDEX_PLATFORMS.map((platform) => (
              <Link
                key={platform.slug}
                href={buildKazancToolUrl({
                  city: selectedCity?.slug ?? null,
                  platform: platform.slug,
                })}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
              >
                <span className="font-medium text-gray-900 group-hover:text-blue-600">
                  {platform.name}
                </span>
                <span className="text-sm text-gray-400 group-hover:text-blue-500">
                  Hesapla →
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={buildKazancToolUrl({
              city: selectedCity?.slug ?? null,
              platform: null,
            })}
            className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Platform seçmeden hesaplama aracına git
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/kurye-kazanc-hesaplama"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Kurye kazanç hesaplama aracını aç
        </Link>
      </div>
    </section>
  );
}
