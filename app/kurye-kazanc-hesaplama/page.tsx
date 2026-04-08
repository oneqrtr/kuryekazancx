import type { Metadata } from 'next';
import { Suspense } from 'react';
import { KazancTool } from '@/components/KazancTool';
import { OnlineKuryeNotice } from '@/components/OnlineKuryeNotice';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Kurye Kazanç Hesaplama 2026 | Paket Başı ve Saatlik Maaş Simülatörü',
  description:
    'Trendyol Go, Getir, Yemeksepeti kurye maaşları ne kadar? Günlük ve aylık paket başı kurye kazancı hesaplama aracı. Saatlik ücretler ve vergi simülatörü.',
  slug: 'kurye-kazanc-hesaplama',
});

function ToolFallback() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-7xl mx-auto my-8 h-96 animate-pulse" />
  );
}

export default function KuryeKazancHesaplamaPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-poppins text-gray-900 mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
              Kurye Kazanç Hesaplama
            </span>{' '}
            ve Maaş Simülatörü 2026
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Motosikletli ve araçlı kuryeler günde, haftada veya ayda ne kadar kazanıyor? Tüm platformlar (Trendyol,
            Getir, Yemeksepeti) için geçerli <strong>paket başı</strong> ve <strong>saatlik</strong> gelirlerinizi
            hemen hesaplayın.
          </p>
          <div className="flex justify-center mb-2">
            <OnlineKuryeNotice />
          </div>
        </div>

        <div id="hesapla">
          <Suspense fallback={<ToolFallback />}>
            <KazancTool />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
