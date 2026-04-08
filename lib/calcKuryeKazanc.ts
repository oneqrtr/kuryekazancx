/**
 * Saf hesaplama mantığı: kurye günlük/haftalık/aylık gelir, yakıt maliyeti, net kâr.
 * Para: 2 ondalık, km: 1 ondalık.
 */

export type PlatformKey = 'getir' | 'trendyol' | 'yemeksepeti';
export type FuelType = 'benzin' | 'dizel' | 'lpg' | 'elektrik';
export type KmMode = 'avgPerPackage' | 'total';

export interface CalculatorInput {
  platform: PlatformKey;
  city: string;
  dailyPackages: number;
  kmMode: KmMode;
  avgKmPerPackage: number;
  totalKm: number;
  fuelType: FuelType;
  fuelPricePerLiterOrKwh: number;
  consumption: number;
  packageFeeOverride?: number;
  bonusPerPackage?: number;
  bonusWeekly?: number;
  bonusOther?: number;
}

export interface CalculatorOutput {
  grossRevenueDaily: number;
  fuelCostDaily: number;
  netProfitDaily: number;
  grossRevenueWeekly: number;
  fuelCostWeekly: number;
  netProfitWeekly: number;
  grossRevenueMonthly: number;
  fuelCostMonthly: number;
  netProfitMonthly: number;
  totalKmDaily: number;
  costPerKm: number;
  profitPerKm: number;
  breakEvenPackages: number;
}

const PLATFORM_PACKAGE_FEE: Record<PlatformKey, number> = {
  getir: 85,
  trendyol: 90,
  yemeksepeti: 70,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
function roundKm(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calcKuryeKazanc(input: CalculatorInput): CalculatorOutput | null {
  const {
    platform,
    dailyPackages,
    kmMode,
    avgKmPerPackage,
    totalKm: inputTotalKm,
    fuelPricePerLiterOrKwh,
    consumption,
    packageFeeOverride,
    bonusPerPackage = 0,
    bonusWeekly = 0,
    bonusOther = 0,
  } = input;

  const packageFee = packageFeeOverride ?? PLATFORM_PACKAGE_FEE[platform];
  const totalKmDaily =
    kmMode === 'total'
      ? inputTotalKm
      : roundKm(avgKmPerPackage * dailyPackages);

  if (dailyPackages < 0 || totalKmDaily < 0 || consumption < 0 || fuelPricePerLiterOrKwh < 0) {
    return null;
  }

  const grossRevenueDaily = roundMoney(
    dailyPackages * packageFee +
      bonusPerPackage * dailyPackages +
      bonusWeekly / 7 +
      bonusOther / 30
  );
  const fuelCostDaily = roundMoney(
    totalKmDaily * (consumption / 100) * fuelPricePerLiterOrKwh
  );
  const netProfitDaily = roundMoney(grossRevenueDaily - fuelCostDaily);

  const grossRevenueWeekly = roundMoney(grossRevenueDaily * 7);
  const fuelCostWeekly = roundMoney(fuelCostDaily * 7);
  const netProfitWeekly = roundMoney(netProfitDaily * 7);

  const grossRevenueMonthly = roundMoney(grossRevenueDaily * 30);
  const fuelCostMonthly = roundMoney(fuelCostDaily * 30);
  const netProfitMonthly = roundMoney(netProfitDaily * 30);

  const costPerKm = totalKmDaily > 0 ? roundMoney(fuelCostDaily / totalKmDaily) : 0;
  const profitPerKm = totalKmDaily > 0 ? roundMoney(netProfitDaily / totalKmDaily) : 0;
  const breakEvenPackages = packageFee > 0 ? Math.ceil(fuelCostDaily / packageFee) : 0;

  return {
    grossRevenueDaily,
    fuelCostDaily,
    netProfitDaily,
    grossRevenueWeekly,
    fuelCostWeekly,
    netProfitWeekly,
    grossRevenueMonthly,
    fuelCostMonthly,
    netProfitMonthly,
    totalKmDaily: roundKm(totalKmDaily),
    costPerKm,
    profitPerKm,
    breakEvenPackages,
  };
}

export function getPlatformPackageFee(platform: PlatformKey, override?: number): number {
  return override ?? PLATFORM_PACKAGE_FEE[platform];
}

/** Hangi alanlar hesaplama için zorunlu – eksik alan kontrolü için */
export function getRequiredFieldsForCalc(): (keyof CalculatorInput)[] {
  return [
    'platform',
    'dailyPackages',
    'fuelPricePerLiterOrKwh',
    'consumption',
  ];
}

/** Örnek kullanım (test / dokümantasyon) */
export const CALC_EXAMPLES = {
  example1: (): CalculatorOutput | null =>
    calcKuryeKazanc({
      platform: 'getir',
      city: 'İstanbul',
      dailyPackages: 40,
      kmMode: 'avgPerPackage',
      avgKmPerPackage: 5,
      totalKm: 0,
      fuelType: 'benzin',
      fuelPricePerLiterOrKwh: 42,
      consumption: 4,
      bonusPerPackage: 0,
      bonusWeekly: 500,
      bonusOther: 0,
    }),
  example2: (): CalculatorOutput | null =>
    calcKuryeKazanc({
      platform: 'trendyol',
      city: 'Ankara',
      dailyPackages: 35,
      kmMode: 'total',
      avgKmPerPackage: 0,
      totalKm: 180,
      fuelType: 'dizel',
      fuelPricePerLiterOrKwh: 38,
      consumption: 3.5,
    }),
};
