import { INDEX_CITIES, INDEX_PLATFORMS, PLATFORM_DEFAULTS, type PlatformSlug } from './kuryeKazancIndex';

/**
 * PSEO için dinamik içerik ve meta verisi üreten yardımcı kütüphane.
 */

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getDynamicMetadata(citySlug: string, platformSlug: string) {
  const city = INDEX_CITIES.find(c => c.slug === citySlug)?.name || capitalize(citySlug);
  const platform = INDEX_PLATFORMS.find(p => p.slug === platformSlug)?.name || capitalize(platformSlug);
  
  return {
    title: `${city} ${platform} Kurye Kazancı Hesabı 2026 | Net Maaş ve Giderler`,
    description: `${city} ilinde ${platform} kuryesi ne kadar kazanır? Güncel ${city} paket ücretleri, yakıt masrafları ve vergi kesintileri dahil detaylı kazanç simülatörü.`,
  };
}

export function getAllPseoCombinations() {
  const combinations: { city: string; platform: string }[] = [];
  
  INDEX_CITIES.forEach(city => {
    INDEX_PLATFORMS.forEach(platform => {
      combinations.push({
        city: city.slug,
        platform: platform.slug
      });
    });
  });
  
  return combinations;
}

export function getCityOnlyMetadata(citySlug: string) {
  const city = INDEX_CITIES.find(c => c.slug === citySlug)?.name || capitalize(citySlug);
  return {
    title: `${city} Kurye Kazancı 2026 | Aylık Maaş ve Paket Başı Hesaplama`,
    description: `${city} ilinde kurye olarak ne kadar kazanılır? Tüm platformlar için günlük, haftalık ve aylık ${city} kurye kazanç simülatörü. KDV, tevfikat ve giderler dahil.`,
  };
}

export function getCityOnlyContent(cityName: string): string {
  const variations = [
    `${cityName} ilinde kurye olarak çalışmayı düşünüyorsanız doğru yerdesiniz. Aşağıdaki hesaplama aracıyla ${cityName} bölgesine özel paket başı veya saatlik kazanç simülasyonunuzu yapabilirsiniz.`,
    `${cityName} kurye piyasası 2026 yılında büyümeye devam ediyor. Trendyol Go, Getir ve Yemeksepeti gibi platformlarda ${cityName}'da aktif kurye olarak aylık ne kadar kazanabileceğinizi simüle edin.`,
    `${cityName} bölgesinde motokurye veya araçlı kurye olarak çalışmak isteyenler için hazırladığımız hesaplayıcıyla, günlük paket sayısı ve çalışma saatlerinize göre tahmini aylık kazancınızı görün.`,
  ];
  const index = cityName.length % variations.length;
  return variations[index];
}
