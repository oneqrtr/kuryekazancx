import { INDEX_CITIES, INDEX_PLATFORMS } from '@/lib/kuryeKazancIndex';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kuryekazanc.com.tr';

  // Ana sayfalar
  const routes = [
    '',
    '/kurye-kazanc-hesaplama',
    '/iletisim',
    '/gizlilik',
    '/kullanim-sartlari',
    '/cerez-politikasi',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));

  // Platform bazlı PSEO sayfaları (getir-kurye-kazanci vb.)
  const platformRoutes = INDEX_PLATFORMS.map(p => ({
    url: `${baseUrl}/${p.slug}-kurye-kazanci`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // İl + Platform kombinasyonları (486 adet)
  const cityPlatformRoutes = [];
  for (const city of INDEX_CITIES) {
    for (const platform of INDEX_PLATFORMS) {
      cityPlatformRoutes.push({
        url: `${baseUrl}/${city.slug}/${platform.slug}-kurye-kazanci`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      });
    }
  }

  // Şehir bazlı sayfalar (81 adet: /[city]/kurye-kazanci)
  const cityOnlyRoutes = INDEX_CITIES.map(city => ({
    url: `${baseUrl}/${city.slug}/kurye-kazanci`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...routes, ...platformRoutes, ...cityPlatformRoutes, ...cityOnlyRoutes];
}
