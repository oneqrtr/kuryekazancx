/**
 * Kurye kazanç hesaplama index altyapısı.
 * Şehir ve platform seçimleri /kurye-kazanc-hesaplama'a yönlendirir.
 * İleride şehir/platform sayfaları eklendiğinde aynı slug'lar kullanılabilir.
 */

const TR_TO_ASCII: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o',
  ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

function cityNameToSlug(name: string): string {
  return name
    .split('')
    .map((c) => TR_TO_ASCII[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** İller: slug (URL için) + name (görünen) */
export const INDEX_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
].map((name) => ({
  name,
  slug: cityNameToSlug(name),
}));

/** Platformlar: slug (URL) + name (görünen) */
export const INDEX_PLATFORMS = [
  { slug: 'getir', name: 'Getir' },
  { slug: 'trendyol', name: 'Trendyol Go' },
  { slug: 'yemeksepeti', name: 'Yemeksepeti' },
  { slug: 'vigo', name: 'Vigo' },
  { slug: 'fiyuu', name: 'fiyuu' },
  { slug: 'pakettaxi', name: 'Paket Taxi' },
] as const;

export const TOOL_PATH = '/kurye-kazanc-hesaplama';

const CITY_SLUGS = new Set<string>(INDEX_CITIES.map((c) => c.slug));
const PLATFORM_SLUGS = new Set<string>(INDEX_PLATFORMS.map((p) => p.slug));

export type PlatformSlug = (typeof INDEX_PLATFORMS)[number]['slug'];

/** Query'den gelen city değerini normalize et; listede varsa slug döner, yoksa null. */
export function validateCitySlug(raw: string | null): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  return slug && CITY_SLUGS.has(slug) ? slug : null;
}

/** Query'den gelen platform değerini normalize et; geçerliyse slug döner. */
export function validatePlatformSlug(raw: string | null): PlatformSlug | null {
  if (raw == null || typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  return PLATFORM_SLUGS.has(slug) ? (slug as PlatformSlug) : null;
}

/** Slug ile şehir adını bul (chip vb. için). */
export function getCityNameBySlug(slug: string): string | null {
  const city = INDEX_CITIES.find((c) => c.slug === slug);
  return city?.name ?? null;
}

/** Platform slug'dan görünen ad. */
export function getPlatformNameBySlug(slug: PlatformSlug): string {
  const p = INDEX_PLATFORMS.find((x) => x.slug === slug);
  return p?.name ?? slug;
}

/** Platform varsayılanları: paket başı ücret, günlük paket sayısı. */
export const PLATFORM_DEFAULTS: Record<PlatformSlug, { packageFee: number; packagesPerDay: number }> = {
  getir: { packageFee: 85, packagesPerDay: 40 },
  trendyol: { packageFee: 90, packagesPerDay: 35 },
  yemeksepeti: { packageFee: 70, packagesPerDay: 45 },
  vigo: { packageFee: 75, packagesPerDay: 40 },
  fiyuu: { packageFee: 75, packagesPerDay: 40 },
  pakettaxi: { packageFee: 80, packagesPerDay: 35 },
};

/**
 * Anatool sayfasına URL üretir. İleride /sehir/platform sayfaları eklense de
 * query ile tool'a yönlendirme aynı kalabilir.
 */
/**
 * Anatool sayfasına URL üretir. PSEO dostu URL'ler (/[city]/[platform]) üretir.
 */
export function buildKazancToolUrl(params: {
  city?: string | null;
  platform?: string | null;
}): string {
  if (params.city && params.platform) {
    return `/${params.city}/${params.platform}-kurye-kazanci`;
  }
  if (params.platform) {
    return `/${params.platform}-kurye-kazanci`;
  }
  if (params.city) {
    return `/${params.city}/kurye-kazanci`;
  }
  return TOOL_PATH;
}
