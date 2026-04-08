'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  calcKuryeKazanc,
  type CalculatorInput,
  type CalculatorOutput,
  type PlatformKey,
  type FuelType,
  type KmMode,
} from '@/lib/calcKuryeKazanc';
import { TURKEY_CITIES } from '@/lib/cities';

const STORAGE_KEY = 'kuryekazanc-calc-input';
const DEBOUNCE_MS = 500;

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  getir: 'Getir',
  trendyol: 'Trendyol Go',
  yemeksepeti: 'Yemeksepeti',
};

const FUEL_LABELS: Record<FuelType, string> = {
  benzin: 'Benzin',
  dizel: 'Dizel',
  lpg: 'LPG',
  elektrik: 'Elektrik',
};

const CONSUMPTION_UNIT: Record<FuelType, string> = {
  benzin: 'L/100km',
  dizel: 'L/100km',
  lpg: 'L/100km',
  elektrik: 'kWh/100km',
};

const PRICE_LABEL: Record<FuelType, string> = {
  benzin: 'Benzin (₺/L)',
  dizel: 'Dizel (₺/L)',
  lpg: 'LPG (₺/L)',
  elektrik: 'Elektrik (₺/kWh)',
};

function defaultInput(): CalculatorInput {
  return {
    platform: 'getir',
    city: '',
    dailyPackages: 40,
    kmMode: 'avgPerPackage',
    avgKmPerPackage: 5,
    totalKm: 200,
    fuelType: 'benzin',
    fuelPricePerLiterOrKwh: 42,
    consumption: 4,
    packageFeeOverride: undefined,
    bonusPerPackage: 0,
    bonusWeekly: 0,
    bonusOther: 0,
  };
}

function parseNum(s: string): number {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function getMissingFields(input: CalculatorInput): string[] {
  const missing: string[] = [];
  if (input.dailyPackages <= 0) missing.push('Günlük paket sayısı');
  if (input.fuelPricePerLiterOrKwh < 0) missing.push('Yakıt fiyatı');
  if (input.consumption < 0) missing.push('Tüketim (L/100km veya kWh/100km)');
  if (input.kmMode === 'avgPerPackage' && input.avgKmPerPackage < 0)
    missing.push('Paket başı ortalama km');
  if (input.kmMode === 'total' && input.totalKm < 0) missing.push('Toplam km');
  return missing;
}

export function KuryeKazancHesaplamaTool() {
  const [input, setInput] = useState<CalculatorInput>(defaultInput);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [howExpand, setHowExpand] = useState(false);

  const readFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search);
    const platform = p.get('platform') as PlatformKey | null;
    const city = p.get('city') ?? '';
    const dailyPackages = p.get('dailyPackages');
    const kmMode = (p.get('kmMode') as KmMode) || 'avgPerPackage';
    const avgKmPerPackage = p.get('avgKmPerPackage');
    const totalKm = p.get('totalKm');
    const fuelType = (p.get('fuelType') as FuelType) || 'benzin';
    const fuelPrice = p.get('fuelPricePerLiterOrKwh');
    const consumption = p.get('consumption');
    const bonusPerPackage = p.get('bonusPerPackage');
    const bonusWeekly = p.get('bonusWeekly');
    const bonusOther = p.get('bonusOther');

    if (
      !platform &&
      !city &&
      !dailyPackages &&
      !avgKmPerPackage &&
      !totalKm &&
      !fuelPrice &&
      !consumption
    ) {
      return null;
    }

    const next = defaultInput();
    if (platform && ['getir', 'trendyol', 'yemeksepeti'].includes(platform))
      next.platform = platform as PlatformKey;
    if (city !== undefined) next.city = city;
    if (dailyPackages !== null) next.dailyPackages = Math.max(0, parseNum(dailyPackages));
    if (kmMode) next.kmMode = kmMode;
    if (avgKmPerPackage !== null) next.avgKmPerPackage = Math.max(0, parseNum(avgKmPerPackage));
    if (totalKm !== null) next.totalKm = Math.max(0, parseNum(totalKm));
    if (fuelType && ['benzin', 'dizel', 'lpg', 'elektrik'].includes(fuelType))
      next.fuelType = fuelType as FuelType;
    if (fuelPrice !== null) next.fuelPricePerLiterOrKwh = Math.max(0, parseNum(fuelPrice));
    if (consumption !== null) next.consumption = Math.max(0, parseNum(consumption));
    if (bonusPerPackage !== null) next.bonusPerPackage = Math.max(0, parseNum(bonusPerPackage));
    if (bonusWeekly !== null) next.bonusWeekly = Math.max(0, parseNum(bonusWeekly));
    if (bonusOther !== null) next.bonusOther = Math.max(0, parseNum(bonusOther));
    return next;
  }, []);

  useEffect(() => {
    const fromUrl = readFromUrl();
    if (fromUrl) {
      setInput(fromUrl);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CalculatorInput>;
        setInput((prev) => ({ ...defaultInput(), ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, [readFromUrl]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      } catch {
        // ignore
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const update = useCallback(<K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const missing = getMissingFields(input);
  const canCalc = missing.length === 0;
  const result: CalculatorOutput | null = canCalc ? calcKuryeKazanc(input) : null;

  const handleReset = () => {
    setInput(defaultInput());
    setTouched({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const buildShareUrl = () => {
    const base = typeof window !== 'undefined' ? window.location.origin + '/kurye-kazanc-hesaplama' : '';
    const p = new URLSearchParams();
    p.set('platform', input.platform);
    if (input.city) p.set('city', input.city);
    p.set('dailyPackages', String(input.dailyPackages));
    p.set('kmMode', input.kmMode);
    p.set('avgKmPerPackage', String(input.avgKmPerPackage));
    p.set('totalKm', String(input.totalKm));
    p.set('fuelType', input.fuelType);
    p.set('fuelPricePerLiterOrKwh', String(input.fuelPricePerLiterOrKwh));
    p.set('consumption', String(input.consumption));
    if (input.bonusPerPackage) p.set('bonusPerPackage', String(input.bonusPerPackage));
    if (input.bonusWeekly) p.set('bonusWeekly', String(input.bonusWeekly));
    if (input.bonusOther) p.set('bonusOther', String(input.bonusOther));
    return `${base}?${p.toString()}`;
  };

  const copyResult = async () => {
    if (!result) return;
    const platformLabel = PLATFORM_LABELS[input.platform];
    const lines = [
      `Platform: ${platformLabel}`,
      input.city ? `Şehir: ${input.city}` : null,
      `Günlük paket: ${input.dailyPackages}`,
      `Günlük km: ${result.totalKmDaily}`,
      `Yakıt (${FUEL_LABELS[input.fuelType]}): ${input.fuelPricePerLiterOrKwh} ₺`,
      `Net günlük: ${result.netProfitDaily.toFixed(2)} ₺`,
      `Net haftalık: ${result.netProfitWeekly.toFixed(2)} ₺`,
      `Net aylık: ${result.netProfitMonthly.toFixed(2)} ₺`,
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const fillExample = (platform: PlatformKey) => {
    const base = defaultInput();
    base.platform = platform;
    base.dailyPackages = platform === 'getir' ? 40 : platform === 'trendyol' ? 35 : 45;
    base.avgKmPerPackage = 5;
    base.totalKm = base.dailyPackages * 5;
    base.fuelPricePerLiterOrKwh = platform === 'yemeksepeti' ? 38 : 42;
    base.consumption = 4;
    setInput(base);
  };

  const formatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const kmFormatter = (n: number) => n.toFixed(1);

  const citySuggestions = input.city
    ? TURKEY_CITIES.filter((c) => c.toLowerCase().includes(input.city.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">
        Bu hesaplama tahmini sonuç verir. Gerçek kazançlar platform politikalarına ve bölgeye göre değişebilir.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-600">Örnek değerleri doldur:</span>
        {(['getir', 'trendyol', 'yemeksepeti'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => fillExample(p)}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
        <button
          type="button"
          onClick={handleReset}
          className="text-sm px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
        >
          Sıfırla
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol: Girdiler */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={input.platform}
              onChange={(e) => update('platform', e.target.value as PlatformKey)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            >
              {(Object.keys(PLATFORM_LABELS) as PlatformKey[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şehir (isteğe bağlı)</label>
            <input
              type="text"
              value={input.city}
              onChange={(e) => update('city', e.target.value)}
              list="city-list"
              placeholder="Örn. İstanbul"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
            <datalist id="city-list">
              {(citySuggestions.length ? citySuggestions : TURKEY_CITIES).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Günlük paket sayısı</label>
            <input
              type="number"
              min={0}
              value={input.dailyPackages || ''}
              onChange={(e) => update('dailyPackages', Math.max(0, parseNum(e.target.value)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
            {touched.dailyPackages && input.dailyPackages <= 0 && (
              <p className="text-red-600 text-xs mt-1">0 veya pozitif olmalı</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Km girişi</span>
            <div className="flex gap-2 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kmMode"
                  checked={input.kmMode === 'avgPerPackage'}
                  onChange={() => update('kmMode', 'avgPerPackage')}
                />
                <span className="text-sm">Paket başı ortalama km</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kmMode"
                  checked={input.kmMode === 'total'}
                  onChange={() => update('kmMode', 'total')}
                />
                <span className="text-sm">Toplam günlük km</span>
              </label>
            </div>
            {input.kmMode === 'avgPerPackage' ? (
              <input
                type="number"
                min={0}
                step={0.1}
                value={input.avgKmPerPackage || ''}
                onChange={(e) => update('avgKmPerPackage', Math.max(0, parseNum(e.target.value)))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
                placeholder="Ort. km"
              />
            ) : (
              <input
                type="number"
                min={0}
                value={input.totalKm || ''}
                onChange={(e) => update('totalKm', Math.max(0, parseNum(e.target.value)))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
                placeholder="Toplam km"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yakıt türü</label>
            <select
              value={input.fuelType}
              onChange={(e) => update('fuelType', e.target.value as FuelType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            >
              {(Object.keys(FUEL_LABELS) as FuelType[]).map((f) => (
                <option key={f} value={f}>
                  {FUEL_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {PRICE_LABEL[input.fuelType]}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={input.fuelPricePerLiterOrKwh || ''}
              onChange={(e) =>
                update('fuelPricePerLiterOrKwh', Math.max(0, parseNum(e.target.value)))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tüketim ({CONSUMPTION_UNIT[input.fuelType]})
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={input.consumption || ''}
              onChange={(e) => update('consumption', Math.max(0, parseNum(e.target.value)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket başı ücret (isteğe bağlı, boşsa platform varsayılanı)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Boş bırakın"
              value={input.packageFeeOverride ?? ''}
              onChange={(e) =>
                update(
                  'packageFeeOverride',
                  e.target.value === '' ? undefined : Math.max(0, parseNum(e.target.value))
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <span className="block text-sm font-medium text-gray-700">Bonus (isteğe bağlı)</span>
            <input
              type="number"
              min={0}
              placeholder="Paket başı bonus (₺)"
              value={input.bonusPerPackage ?? ''}
              onChange={(e) =>
                update('bonusPerPackage', e.target.value === '' ? undefined : Math.max(0, parseNum(e.target.value)))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              min={0}
              placeholder="Haftalık bonus (₺)"
              value={input.bonusWeekly ?? ''}
              onChange={(e) =>
                update('bonusWeekly', e.target.value === '' ? undefined : Math.max(0, parseNum(e.target.value)))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              min={0}
              placeholder="Diğer aylık bonus (₺)"
              value={input.bonusOther ?? ''}
              onChange={(e) =>
                update('bonusOther', e.target.value === '' ? undefined : Math.max(0, parseNum(e.target.value)))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>

          {missing.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">Hesaplamak için şu alanlar eksik:</p>
              <ul className="list-disc list-inside">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sağ: Sonuçlar */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Günlük</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Brüt gelir:</span>
                  <span className="font-medium">{formatter.format(result.grossRevenueDaily)} ₺</span>
                  <span className="text-gray-600">Yakıt maliyeti:</span>
                  <span className="font-medium text-red-600">-{formatter.format(result.fuelCostDaily)} ₺</span>
                  <span className="text-gray-600">Net kâr:</span>
                  <span className="font-semibold text-green-600">
                    {formatter.format(result.netProfitDaily)} ₺
                  </span>
                </div>
                <div className="pt-2 border-t text-sm">
                  <span className="text-gray-600">Toplam km: </span>
                  <span className="font-medium">{kmFormatter(result.totalKmDaily)} km</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600">Km başı maliyet: </span>
                  <span>{formatter.format(result.costPerKm)} ₺</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600">Km başı kâr: </span>
                  <span className="text-green-600">{formatter.format(result.profitPerKm)} ₺</span>
                </div>
                {result.breakEvenPackages > 0 && (
                  <p className="text-xs text-gray-500">
                    Yakıtı karşılamak için en az {result.breakEvenPackages} paket gerekir.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Haftalık / Aylık (tahmini)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-gray-600">Net haftalık (7 gün):</span>
                  <span className="font-medium">{formatter.format(result.netProfitWeekly)} ₺</span>
                  <span className="text-gray-600">Net aylık (30 gün):</span>
                  <span className="font-medium">{formatter.format(result.netProfitMonthly)} ₺</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyResult}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  Sonucu kopyala
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(buildShareUrl())}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Paylaşılabilir linki kopyala
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-500">
              Eksik alanları doldurup hesaplama yapabilirsiniz.
            </div>
          )}

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHowExpand(!howExpand)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-800"
            >
              Nasıl hesaplıyoruz?
              <span className="text-gray-500">{howExpand ? '−' : '+'}</span>
            </button>
            {howExpand && (
              <div className="px-4 py-3 bg-white text-sm text-gray-700 space-y-2 border-t">
                <p>
                  <strong>Brüt günlük gelir</strong> = (Günlük paket × Paket başı ücret) + Paket başı bonus × Paket
                  + Haftalık bonus ÷ 7 + Diğer bonus ÷ 30
                </p>
                <p>
                  <strong>Yakıt maliyeti</strong> = Günlük toplam km × (Tüketim ÷ 100) × Yakıt fiyatı
                </p>
                <p>
                  <strong>Günlük toplam km</strong> = Paket başı ortalama km × Günlük paket (veya doğrudan toplam km)
                </p>
                <p>
                  <strong>Net günlük kâr</strong> = Brüt günlük gelir − Yakıt maliyeti
                </p>
                <p>
                  <strong>Haftalık / aylık</strong> = Net günlük × 7 ve × 30 (tahmini)
                </p>
                <p>
                  <strong>Yakıtı karşılama (break-even)</strong> = Yakıt maliyeti ÷ Paket başı ücret (yukarı yuvarlanır)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
