import { Suspense } from 'react';
import { KazancTool } from '@/components/KazancTool';
import { AdBanner } from '@/components/AdBanner';
import { getDynamicMetadata, getSpintaxContent, capitalize, getCityOnlyMetadata, getCityOnlyContent } from '@/lib/pseo';
import { INDEX_CITIES, INDEX_PLATFORMS, PLATFORM_DEFAULTS, type PlatformSlug } from '@/lib/kuryeKazancIndex';
import { getPageBySlug } from '@/lib/content';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

interface PseoPageProps {
  params: {
    path: string[];
  };
}

export async function generateMetadata({ params }: PseoPageProps): Promise<Metadata> {
  const { path } = await params;
  
  // Case 0: /[city]/kurye-kazanci (city-only)
  if (path.length === 2 && path[1] === 'kurye-kazanci') {
    const { title, description } = getCityOnlyMetadata(path[0]);
    return { title, description, alternates: { canonical: `/${path[0]}/kurye-kazanci` } };
  }

  // Case 1: /[city]/[platform-slug]
  if (path.length === 2) {
    const [citySlug, platformSlug] = path;
    const platformKey = platformSlug.replace('-kurye-kazanci', '');
    const { title, description } = getDynamicMetadata(citySlug, platformKey);
    return { title, description, alternates: { canonical: `/${citySlug}/${platformSlug}` } };
  }

  // Case 2: /[platform-slug]
  if (path.length === 1) {
    const slug = path[0];
    const page = await getPageBySlug(slug);
    if (page) {
      return { title: page.title, description: page.intro, alternates: { canonical: `/${slug}` } };
    }
  }

  return { title: 'Kurye Kazanç Hesaplama' };
}

export default async function PseoUnifiedPage({ params }: PseoPageProps) {
  const { path } = await params;

  // 0. SADECE ŞEHİR (/[city]/kurye-kazanci)
  if (path.length === 2 && path[1] === 'kurye-kazanci') {
    const citySlug = path[0];
    const cityObj = INDEX_CITIES.find(c => c.slug === citySlug);
    if (!cityObj) notFound();

    const cityName = cityObj.name;
    const intro = getCityOnlyContent(cityName);

    return (
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{cityName} Kurye Kazancı</span>
        </nav>

        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            <span className="text-blue-600">{cityName}</span> Kurye Kazancı 2026
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">{intro}</p>
        </div>

        <AdBanner />

        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-pulse h-96" />}>
          <KazancTool />
        </Suspense>

        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{cityName}&apos;de Kuryelik</h2>
          <p className="text-gray-600 mb-6">{cityName} ilinde aktif kurye olarak tüm platformlarda (Trendyol Go, Getir, Yemeksepeti) çalışabilirsiniz. Platform bazlı hesaplama için aşağıdaki bağlantıları inceleyebilirsiniz.</p>
          <div className="flex flex-wrap gap-3">
            {INDEX_PLATFORMS.map(p => (
              <Link key={p.slug} href={`/${citySlug}/${p.slug}-kurye-kazanci`} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-sm transition-colors">
                {cityName} {p.name} Kazancı →
              </Link>
            ))}
          </div>
        </div>
      </article>
    );
  }

  // 1. IL + PLATFORM (/[city]/[platform-slug])
  if (path.length === 2) {
    const [citySlug, platformSlug] = path;
    const platformKey = platformSlug.replace('-kurye-kazanci', '') as PlatformSlug;
    
    const cityObj = INDEX_CITIES.find(c => c.slug === citySlug);
    const platformObj = INDEX_PLATFORMS.find(p => p.slug === platformKey);

    if (!cityObj || !platformObj) notFound();

    const cityName = cityObj.name;
    const platformName = platformObj.name;
    const defaults = PLATFORM_DEFAULTS[platformKey];
    const intro = getSpintaxContent(cityName, platformName);

    return (
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{cityName}</span>
        </nav>

        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {cityName} <span className="text-blue-600">{platformName}</span> Kurye Kazancı 2026
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">{intro}</p>
        </div>

        <AdBanner />

        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-pulse h-96" />}>
          <KazancTool initialPackageFee={defaults.packageFee} initialPackagesPerDay={defaults.packagesPerDay} />
        </Suspense>

        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{cityName} Bölgesinde Kuryelik</h2>
          <p className="text-gray-600">{cityName} ilinde {platformName} ile çalışırken paket yoğunluğuna göre ek primler kazanabilirsiniz.</p>
        </div>
      </article>
    );
  }

  // 2. SADECE PLATFORM (/[platform-slug])
  if (path.length === 1) {
    const slug = path[0];
    const page = await getPageBySlug(slug);

    if (!page) notFound();

    return (
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">{page.title}</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">{page.intro}</p>
        
        <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100" />}>
          <KazancTool 
             initialPackageFee={page.package_fee} 
             initialPackagesPerDay={page.packages_per_day} 
             initialFuelCostPerDay={page.fuel_cost_per_day} 
          />
        </Suspense>
        
        {page.content && (
          <div className="max-w-3xl mx-auto mt-12 text-left prose prose-blue">
            <p>{page.content}</p>
          </div>
        )}
      </article>
    );
  }

  notFound();
}
