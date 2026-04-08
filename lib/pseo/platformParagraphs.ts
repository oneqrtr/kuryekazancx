import type { PlatformSlug } from '@/lib/kuryeKazancIndex';
import { getPlatformNameBySlug } from '@/lib/kuryeKazancIndex';

/**
 * Şehir + platform PSEO sayfaları için platforma özgü metinler.
 * {city} ve {platform} yer tutucuları doldurulur.
 */

export type PlatformPseoBlock = {
  paragraphs: [string, string];
  sectionTitle: string;
  sectionBody: string;
};

export const PLATFORM_PSEO_BLOCKS: Record<PlatformSlug, PlatformPseoBlock> = {
  getir: {
    paragraphs: [
      '{city} bölgesinde Getir’de araçlı veya esnaf kurye modeliyle çalışanların geliri; saatlik garanti ücret ile tamamlanan paket ücretlerinin birlikte hesaplanmasıyla şekillenir. Depo çevresinde sipariş yoğunluğu arttıkça günlük paket sayısı ve dolayısıyla brüt ciro genelde yükselir.',
      'Vardiya seçimi, çalışılan gün ve saat dilimi Getir kazancını doğrudan etkiler. Aşağıdaki simülatörde {city} için paket başı ücretinizi, çalışma saatinizi ve KDV ile tevfikat kesintilerinizi girerek tahmini günlük ve aylık sonuçları görebilirsiniz.',
    ],
    sectionTitle: '{city} ve Getir ile kuryelik',
    sectionBody:
      '{city} ilinde Getir ile çalışırken hem saatlik taban hem paket başı gelirleri bir arada değerlendirmek gerekir. Yoğun saatlerde paket sayısı artar; sakin dilimlerde saatlik garanti, gelirin daha öngörülebilir kalmasına yardımcı olabilir. Yukarıdaki aracı kendi rutininize göre güncelleyerek senaryolarınızı karşılaştırabilirsiniz.',
  },
  trendyol: {
    paragraphs: [
      'Trendyol Go’da {city} lokasyonunda kurye geliri; tamamlanan paket sayısı, mesafe ve kampanyalı saatlerdeki ek ücretler gibi unsurlara bağlı olarak gün içinde ciddi farklar gösterebilir. Aynı gün içinde bile sipariş dağılımı değişebileği için ortalama bir tablo yerine kendi paket hızınızı baz almak daha sağlıklıdır.',
      'Aşağıdaki hesaplayıcı ile {city} için paket başı ücret tahmininizi, günlük çalışma sürenizi ve vergi kesintilerinizi girerek Trendyol Go senaryonuza uygun tahmini aylık brüt ve net bandı oluşturabilirsiniz.',
    ],
    sectionTitle: '{city} ve Trendyol Go kazancı',
    sectionBody:
      '{city} bölgesinde Trendyol Go ile çalışırken “yoğun saat” ve mesafe bileşenleri toplam geliri belirler. Simülatörde saatlik ve paket modlarını değiştirerek hangi çalışma tipinin sizin girdiğiniz rakamlara daha yakın sonuç verdiğini görebilirsiniz.',
  },
  yemeksepeti: {
    paragraphs: [
      'Yemeksepeti saha modelinde {city}’de günlük kazanç; atan paket sayısı, bölge bülteni ve vardiya yapısına göre değişir. Öğle ve akşam öğünlerinde talep genelde artar; bu dönemlerde paket başı gelir toplamının büyük kısmını oluşturabilir.',
      'Kendi {city} çalışma düzeninize uygun tahmin için aşağıdaki araçta paket ücreti, günlük paket veya saatlik mod ile KDV ve tevfikat alanlarını doldurmanız yeterli; haftalık ve aylık toplamlar otomatik güncellenir.',
    ],
    sectionTitle: '{city} ve Yemeksepeti kurye geliri',
    sectionBody:
      '{city} ilinde Yemeksepeti ile çalışırken günlük atılan paket sayısı net kazancı en çok hareket ettiren parametrelerden biridir. Farklı paket hızları için aracı kaydedip sonuçları karşılaştırarak hedefinize uygun çalışma yoğunluğunu görselleştirebilirsiniz.',
  },
  vigo: {
    paragraphs: [
      'Vigo’da {city} bölgesinde ücretlendirme genelde saatlik garanti ve tamamlanan görevler üzerinden ilerler. Çoklu vardiya veya farklı görev tipleri aynı gün içinde farklı kazanç profilleri oluşturabilir; bu yüzden tek bir “ortalama maaş” yerine kendi çalışma saatlerinize göre hesap yapmak daha anlamlıdır.',
      'Simülatörde {city} için saatlik ücret veya hibrit modları kullanarak Vigo rutininize yakın bir tahmin oluşturabilir; yakıt ve kesinti alanlarıyla net tarafı da birlikte değerlendirebilirsiniz.',
    ],
    sectionTitle: '{city} ve Vigo çalışma modeli',
    sectionBody:
      '{city}’de Vigo ile çalışırken saatlik tabanın paket veya görev geliriyle nasıl birleştiğini arayüzde deneyerek görmek mümkün. Yoğun günlerde toplam saat veya paket sayısını artırarak senaryolarınızı güncelleyin.',
  },
  fiyuu: {
    paragraphs: [
      'fiyuu tarafında {city} lokasyonunda gelir; sipariş başı ücretlere, mesafe veya rota tazminatı niteliğindeki kalemlere ve dönemsel düzenlemelere göre şekillenir. Şehir içi kısa mesafeler ile çevre hatlarda aynı gün içindeki birim kazanç farklılaşabilir.',
      'Aşağıdaki hesaplayıcıda {city} için paket başı rakamınızı ve günlük sipariş hacminizi girerek fiyuu senaryonuza uygun tahmini aylık brüt ve gider sonrası tabloyu çıkarabilirsiniz.',
    ],
    sectionTitle: '{city} ve fiyuu kurye ücretleri',
    sectionBody:
      '{city} bölgesinde fiyuu ile çalışırken km veya paket başı varsayımlarınızı sık güncellemek, yakıt maliyetleri değiştiğinde daha gerçekçi bir net tablo verir. Aracı farklı paket hızları için tekrar çalıştırmak faydalıdır.',
  },
  pakettaxi: {
    paragraphs: [
      'Paket Taxi’de {city}’de kazanç; kiralık motor veya kendi aracınızla çalışma modeline, günlük teslimat sayısına ve rota uzunluğuna bağlıdır. Operasyonel giderler (kira, yakıt, bakım) brüt gelirden düşüldüğünde net tablo platformdan platforma ve güne göre değişir.',
      '{city} için aşağıdaki simülatörde paket ücreti, günlük paket adedi ve günlük yakıt gideri alanlarını doldurarak Paket Taxi rutininize yakın bir tahmini gelir-gider dengesi kurabilirsiniz.',
    ],
    sectionTitle: '{city} ve Paket Taxi gelir yapısı',
    sectionBody:
      '{city} ilinde Paket Taxi ile çalışırken kiralık araç sabit gideri net kazancı belirgin şekilde etkiler. Simülatörde yakıt ve günlük paket sayısını oynatarak brüt ile net arasındaki farkı netleştirebilirsiniz.',
  },
};

function fillTemplate(template: string, city: string, platformSlug: PlatformSlug): string {
  const platform = getPlatformNameBySlug(platformSlug);
  return template.replaceAll('{city}', city).replaceAll('{platform}', platform);
}

/** Şehir adı bilinen PSEO sayfaları (ör. /ankara/getir-kurye-kazanci) */
export function getCityPlatformPseoBlocks(cityName: string, platformSlug: PlatformSlug): PlatformPseoBlock {
  const raw = PLATFORM_PSEO_BLOCKS[platformSlug];
  return {
    paragraphs: [
      fillTemplate(raw.paragraphs[0], cityName, platformSlug),
      fillTemplate(raw.paragraphs[1], cityName, platformSlug),
    ],
    sectionTitle: fillTemplate(raw.sectionTitle, cityName, platformSlug),
    sectionBody: fillTemplate(raw.sectionBody, cityName, platformSlug),
  };
}

/** Tek segment platform sayfaları (ör. /getir-kurye-kazanci) — şehir yok */
const GENERIC_CITY_LABEL = 'Çalıştığınız ilde';

export function getPlatformPseoBlocksGeneric(platformSlug: PlatformSlug): PlatformPseoBlock {
  return getCityPlatformPseoBlocks(GENERIC_CITY_LABEL, platformSlug);
}

export function slugToPlatformKey(slug: string): PlatformSlug | null {
  const suffix = '-kurye-kazanci';
  if (!slug.endsWith(suffix)) return null;
  const key = slug.slice(0, -suffix.length) as PlatformSlug;
  return key in PLATFORM_PSEO_BLOCKS ? key : null;
}
