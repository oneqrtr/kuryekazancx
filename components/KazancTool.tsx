'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  validateCitySlug,
  validatePlatformSlug,
  getCityNameBySlug,
  getPlatformNameBySlug,
  PLATFORM_DEFAULTS,
  type PlatformSlug,
} from '@/lib/kuryeKazancIndex';

// Vergi/kesinti sabitleri
const TEVKIFAT_ORANI = 0.20;

interface KazancToolProps {
    initialPackageFee?: number;
    initialPackagesPerDay?: number;
    initialWorkDaysPerMonth?: number;
    initialFuelCostPerDay?: number;
}

export function KazancTool({
    initialPackageFee = 80,
    initialPackagesPerDay = 40,
    initialWorkDaysPerMonth = 26,
    initialFuelCostPerDay = 0,
}: KazancToolProps) {
    const searchParams = useSearchParams();
    const urlParamsApplied = useRef(false);

    // Sol taraf: Kazanç Inputları
    const [workHours, setWorkHours] = useState(10);
    const [ordersPerHour, setOrdersPerHour] = useState(initialPackagesPerDay > 0 ? initialPackagesPerDay / 10 : 4);
    const [pkgFeeInput, setPkgFeeInput] = useState(initialPackageFee);
    const [kdvDahil, setKdvDahil] = useState(false);
    const [fuelCostPerDay, setFuelCostPerDay] = useState(initialFuelCostPerDay);

    const [useKm, setUseKm] = useState(false);
    const [kmFee, setKmFee] = useState(5);
    const [avgKm, setAvgKm] = useState(5);

    const [mode, setMode] = useState<'paket' | 'saat' | 'hibrit'>('paket');
    const [hourlyFee, setHourlyFee] = useState(170);
    const [hybridThreshold, setHybridThreshold] = useState(0);
    const [saatlikHesapTipi, setSaatlikHesapTipi] = useState<'saatlikten' | 'toplamdan'>('saatlikten');
    const [aylikToplamUcret, setAylikToplamUcret] = useState(44200);

    const [useSecondPackage, setUseSecondPackage] = useState(false);
    const [secondPackageFeeInput, setSecondPackageFeeInput] = useState(70);

    const [dailyBonuses, setDailyBonuses] = useState<{ id: string; packageCount: number; bonusAmount: number }[]>([]);
    const [weeklyBonuses, setWeeklyBonuses] = useState<{ id: string; packageCount: number; bonusAmount: number }[]>([]);
    const [useDailyBonus, setUseDailyBonus] = useState(false);
    const [useWeeklyBonus, setUseWeeklyBonus] = useState(false);
    const [isBonusAccordionOpen, setIsBonusAccordionOpen] = useState(false);

    useEffect(() => {
        try {
            const savedDaily = localStorage.getItem('kurye_daily_bonuses');
            const savedWeekly = localStorage.getItem('kurye_weekly_bonuses');
            const savedUseDaily = localStorage.getItem('kurye_use_daily_bonus');
            const savedUseWeekly = localStorage.getItem('kurye_use_weekly_bonus');
            
            if (savedDaily) setDailyBonuses(JSON.parse(savedDaily));
            if (savedWeekly) setWeeklyBonuses(JSON.parse(savedWeekly));
            if (savedUseDaily) setUseDailyBonus(savedUseDaily === 'true');
            if (savedUseWeekly) setUseWeeklyBonus(savedUseWeekly === 'true');
        } catch(e) {}
    }, []);

    useEffect(() => {
        try {
            if (dailyBonuses.length > 0 || useDailyBonus) localStorage.setItem('kurye_daily_bonuses', JSON.stringify(dailyBonuses));
            if (weeklyBonuses.length > 0 || useWeeklyBonus) localStorage.setItem('kurye_weekly_bonuses', JSON.stringify(weeklyBonuses));
            localStorage.setItem('kurye_use_daily_bonus', String(useDailyBonus));
            localStorage.setItem('kurye_use_weekly_bonus', String(useWeeklyBonus));
        } catch(e) {}
    }, [dailyBonuses, weeklyBonuses, useDailyBonus, useWeeklyBonus]);

    const [izinVar, setIzinVar] = useState(initialWorkDaysPerMonth === 26);
    const [toplamPaketGir, setToplamPaketGir] = useState(false);
    const [gunlukToplamPaket, setGunlukToplamPaket] = useState(40);

    const kdvOrani = 20; // Artık sabit, UI'dan değiştirilmiyor.

    // Modal durumları
    const [hibritKmModu, setHibritKmModu] = useState<'gunluk' | 'paket'>('paket');
    const [isSecondPackageModalOpen, setIsSecondPackageModalOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null);
    const [selectedPlatformSlug, setSelectedPlatformSlug] = useState<PlatformSlug | null>(null);

    // URL parametrelerinden başlangıç değerlerini uygula
    useEffect(() => {
        if (urlParamsApplied.current) return;
        const cityRaw = searchParams.get('city');
        const platformRaw = searchParams.get('platform');
        const paket = searchParams.get('paket');
        const gunluk = searchParams.get('gunluk');
        const gun = searchParams.get('gun');

        const citySlug = validateCitySlug(cityRaw);
        const platformSlug = validatePlatformSlug(platformRaw);
        if (citySlug != null) {
            setSelectedCitySlug(citySlug);
            try {
                localStorage.setItem('kurye_last_city_slug', citySlug);
            } catch {
                /* ignore */
            }
        }
        if (platformSlug != null) {
            setSelectedPlatformSlug(platformSlug);
            const def = PLATFORM_DEFAULTS[platformSlug];
            setPkgFeeInput(def.packageFee);
            setOrdersPerHour(Math.max(0.1, def.packagesPerDay / 10));
        }

        if (paket != null) {
            const n = Number(paket);
            if (!Number.isNaN(n)) setPkgFeeInput(n);
        }
        if (gunluk != null) {
            const n = Number(gunluk);
            if (!Number.isNaN(n) && n > 0) setOrdersPerHour(Math.max(0.1, n / workHours));
        }
        if (gun != null) {
            const n = Number(gun);
            if (n === 26) setIzinVar(true);
            if (n === 30) setIzinVar(false);
        }
        urlParamsApplied.current = true;
    }, [searchParams, workHours]);

    const monteCarloSimulation = (iterations = 1000): number => {
        const kdvDecimal = kdvOrani / 100;
        const pkgFee = kdvDahil ? pkgFeeInput / (1 + kdvDecimal) : pkgFeeInput;
        const secondPackageFee = kdvDahil ? secondPackageFeeInput / (1 + kdvDecimal) : secondPackageFeeInput;
        const packageDistribution = [
            { count: 1, probability: 0.60 },
            { count: 2, probability: 0.25 },
            { count: 3, probability: 0.10 },
            { count: 4, probability: 0.05 }
        ];
        let totalPerPackageEarnings = 0;
        for (let i = 0; i < iterations; i++) {
            const random = Math.random();
            let packageCount = 1;
            let cumulativeProbability = 0;
            for (const dist of packageDistribution) {
                cumulativeProbability += dist.probability;
                if (random <= cumulativeProbability) {
                    packageCount = dist.count;
                    break;
                }
            }
            let totalEarningsForDelivery = pkgFee;
            if (packageCount >= 2) totalEarningsForDelivery += secondPackageFee * (packageCount - 1);
            totalPerPackageEarnings += totalEarningsForDelivery / packageCount;
        }
        return totalPerPackageEarnings / iterations;
    };

    const results = useMemo(() => {
        const gunSayisiHaftalik = izinVar ? 6 : 7;
        const gunSayisiAylik = izinVar ? 26 : 30;
        const dailyPackageCount = toplamPaketGir ? gunlukToplamPaket : ordersPerHour * workHours;
        const weeklyPackageCount = dailyPackageCount * gunSayisiHaftalik;
        const monthlyPackageCount = dailyPackageCount * gunSayisiAylik;

        const kdvDecimal = kdvOrani / 100;

        let perPackageKdvHaric = 0;
        if (mode === 'paket' || mode === 'hibrit') {
            if (useSecondPackage) {
                perPackageKdvHaric = monteCarloSimulation(1000);
            } else {
                perPackageKdvHaric = kdvDahil ? pkgFeeInput / (1 + kdvDecimal) : pkgFeeInput;
            }
        }

        let actualHourlyFee = hourlyFee;
        const isKmPerPackage = mode === 'paket' || (mode === 'hibrit' && hibritKmModu === 'paket');
        const kmTotalMultiplier = isKmPerPackage ? dailyPackageCount : 1;
        const dailyKmBaseBrut = useKm ? (kmFee * avgKm * kmTotalMultiplier) : 0;
        const dailyKmBase = kdvDahil ? dailyKmBaseBrut / (1 + kdvDecimal) : dailyKmBaseBrut;

        if ((mode === 'saat' || mode === 'hibrit') && saatlikHesapTipi === 'toplamdan') {
            const totalDays = gunSayisiAylik;
            const targetDailyKdvHaric = kdvDahil ? (aylikToplamUcret / totalDays) / (1 + kdvDecimal) : (aylikToplamUcret / totalDays);
            actualHourlyFee = Math.max(0, (targetDailyKdvHaric - dailyKmBase) / workHours);
        }

        const packageEarningsKdvHaric = (mode === 'paket' || mode === 'hibrit') 
            ? perPackageKdvHaric * Math.max(0, dailyPackageCount - (mode === 'hibrit' ? hybridThreshold : 0)) 
            : 0;
        const hourlyEarningsKdvHaric = (mode === 'saat' || mode === 'hibrit') ? actualHourlyFee * workHours : 0;
        const baseMatrahGunluk = packageEarningsKdvHaric + hourlyEarningsKdvHaric + dailyKmBase;

        let bonusGunlukKdvHaric = 0;
        let weeklyBonusKdvHaric = 0;
        if (mode === 'paket' || mode === 'hibrit') {
            if (useDailyBonus) {
                const achievedDaily = dailyBonuses.filter(b => dailyPackageCount >= b.packageCount && b.packageCount > 0);
                if (achievedDaily.length > 0) {
                    const maxBonus = Math.max(...achievedDaily.map(b => b.bonusAmount));
                    bonusGunlukKdvHaric = kdvDahil ? maxBonus / (1 + kdvDecimal) : maxBonus;
                }
            }
            if (useWeeklyBonus) {
                const achievedWeekly = weeklyBonuses.filter(b => weeklyPackageCount >= b.packageCount && b.packageCount > 0);
                if (achievedWeekly.length > 0) {
                    const maxBonus = Math.max(...achievedWeekly.map(b => b.bonusAmount));
                    weeklyBonusKdvHaric = kdvDahil ? maxBonus / (1 + kdvDecimal) : maxBonus;
                }
            }
        }

        const dailyBrut = (baseMatrahGunluk + bonusGunlukKdvHaric) * (1 + kdvDecimal);

        return {
            dailyBrut,
            weeklyBrut: dailyBrut * gunSayisiHaftalik + weeklyBonusKdvHaric * (1 + kdvDecimal),
            monthlyBrut: dailyBrut * gunSayisiAylik + weeklyBonusKdvHaric * (1 + kdvDecimal) * 4,
            dailyPackageCount,
            weeklyPackageCount,
            monthlyPackageCount,
            bonusGunlukBrut: kdvDahil ? bonusGunlukKdvHaric * (1 + kdvDecimal) : bonusGunlukKdvHaric,
            bonusHaftalikBrut: kdvDahil ? weeklyBonusKdvHaric * (1 + kdvDecimal) : weeklyBonusKdvHaric,
            gunSayisiHaftalik,
            gunSayisiAylik
        };
    }, [
        workHours, ordersPerHour, pkgFeeInput, kdvDahil, useKm, kmFee, avgKm, mode, hourlyFee, 
        saatlikHesapTipi, aylikToplamUcret, useSecondPackage, secondPackageFeeInput, 
        dailyBonuses, weeklyBonuses, izinVar, kdvOrani,
        toplamPaketGir, gunlukToplamPaket, hibritKmModu, useDailyBonus, useWeeklyBonus, hybridThreshold
    ]);

    const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
    const formatPrice = (price: number) => formatter.format(price);

    return (
        <div className="space-y-8">
            {/* STICKY SUMMARY BAR */}
            <div className="sticky top-[4.5rem] z-30 -mx-4 px-2 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-3 gap-1 md:gap-4 items-start">
                    <div className="flex justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest leading-tight">Tahmini Aylık Brüt Kazanç</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl md:text-4xl font-black text-blue-600 leading-none">{formatPrice(results.monthlyBrut)}</span>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-12 xl:col-span-12">
                    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 gap-8">
                            {/* Sol: Earnings Calculator */}
                            <div>
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Kurye olarak ne kadar kazanırım?</h2>
                                </div>
                                <div className="space-y-6">
                                    {/* Çalışma Modu Toggles */}
                                    <div className="flex items-center bg-gray-100 p-1.5 rounded-lg w-full">
                                        <button type="button" onClick={() => setMode('paket')} className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-md transition-all ${mode === 'paket' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Paket</button>
                                        <button type="button" onClick={() => setMode('saat')} className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-md transition-all ${mode === 'saat' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Saat</button>
                                        <button type="button" onClick={() => setMode('hibrit')} className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-md transition-all ${mode === 'hibrit' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Saat + Paket</button>
                                    </div>

                                    {/* KDV Dahil Button Prominent at top */}
                                    <div className="flex items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <input type="checkbox" id="kdvDahil" checked={kdvDahil} onChange={e => setKdvDahil(e.target.checked)} className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500" />
                                        <label htmlFor="kdvDahil" className="ml-3 text-base font-bold text-gray-800 cursor-pointer select-none">Tüm ücretler KDV Dahil</label>
                                    </div>

                                    {/* Toplam Paket Gir Checkbox */}
                                    {(mode === 'paket' || mode === 'hibrit') && (
                                        <div className="flex items-center">
                                            <input type="checkbox" id="toplamPaketGir" checked={toplamPaketGir} onChange={e => setToplamPaketGir(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                            <label htmlFor="toplamPaketGir" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">Toplam Paket Sayısı Gir (Saatlik hesaplamayı es geç)</label>
                                        </div>
                                    )}

                                    {toplamPaketGir && (mode === 'paket' || mode === 'hibrit') ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Günlük Toplam Paket</label>
                                            <input type="number" min="0" value={gunlukToplamPaket} onChange={(e) => setGunlukToplamPaket(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Günlük Çalışma Saati</label>
                                                <input type="number" min="0" max="24" value={workHours} onChange={(e) => setWorkHours(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                            {(mode === 'paket' || mode === 'hibrit') && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Saatte Ortalama Sipariş</label>
                                                    <input type="number" min="0" max="20" value={ordersPerHour} onChange={(e) => setOrdersPerHour(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {(mode === 'paket' || mode === 'hibrit') && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Paket Başına Ücret (₺)</label>
                                                <input type="number" min="0" max="200" step="0.01" value={pkgFeeInput} onChange={e => setPkgFeeInput(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                {kdvDahil && pkgFeeInput > 0 && (
                                                    <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Paket birim fiyatı = {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pkgFeeInput / (1 + (kdvOrani / 100)))} ₺
                                                    </p>
                                                )}
                                            </div>
                                            {mode === 'hibrit' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Paket Başı Prim Eşiği</label>
                                                    <input type="number" min="0" max="100" value={hybridThreshold} onChange={e => setHybridThreshold(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                    <p className="text-xs text-gray-500 mt-1">Günde kaçıncı paketten sonra ücret ödenmeye başlansın?</p>
                                                </div>
                                            )}
                                            <div className="flex items-center text-gray-700">
                                                <input type="checkbox" id="useSecondPackage" checked={useSecondPackage} onChange={e => { setUseSecondPackage(e.target.checked); if (e.target.checked) setIsSecondPackageModalOpen(true); }} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                                <label htmlFor="useSecondPackage" className="ml-2 text-sm font-medium">2. Paket ücreti dahil edilsin</label>
                                            </div>
                                            <div className={useSecondPackage ? '' : 'opacity-50 pointer-events-none'}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">2. Paket Ücreti (₺)</label>
                                                <input type="number" min="0" step="0.01" value={secondPackageFeeInput} onChange={e => setSecondPackageFeeInput(Number(e.target.value))} disabled={!useSecondPackage} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                {kdvDahil && secondPackageFeeInput > 0 && useSecondPackage && (
                                                    <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        2. Paket birim fiyatı = {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(secondPackageFeeInput / (1 + (kdvOrani / 100)))} ₺
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {(mode === 'saat' || mode === 'hibrit') && (
                                        <div className="space-y-4">
                                            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                                <button onClick={() => setSaatlikHesapTipi('saatlikten')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${saatlikHesapTipi === 'saatlikten' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{mode === 'hibrit' ? 'Saatlik Ücret + Paket' : 'Saatlik Ücretten Maaşa'}</button>
                                                <button onClick={() => setSaatlikHesapTipi('toplamdan')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${saatlikHesapTipi === 'toplamdan' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{mode === 'hibrit' ? 'Sabit Maaş + Paket' : 'Aylık Maaştan Ücrete'}</button>
                                            </div>
                                            {saatlikHesapTipi === 'saatlikten' ? (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Saatlik Ücret (₺)</label>
                                                    <input type="number" min="0" step="0.01" value={hourlyFee} onChange={e => setHourlyFee(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                    {hourlyFee > 0 && (
                                                        <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            Aylık toplam maaş ({izinVar ? '26' : '30'} gün üzerinden) = {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(hourlyFee * workHours * (izinVar ? 26 : 30))}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{mode === 'hibrit' ? 'Sabit Taban Maaş (₺)' : 'Aylık Toplam Maaş Hedefi (₺)'}</label>
                                                    <input type="number" min="0" step="1" value={aylikToplamUcret} onChange={e => setAylikToplamUcret(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                    {aylikToplamUcret > 0 && (
                                                        <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            Gereken saatlik ücret ({izinVar ? '26' : '30'} gün üzerinden) = {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(aylikToplamUcret / (workHours * (izinVar ? 26 : 30)))} ₺
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-700">
                                        <input type="checkbox" id="useKm" checked={useKm} onChange={e => setUseKm(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                        <label htmlFor="useKm" className="ml-2 text-sm font-medium">Km ücreti dahil edilsin</label>
                                    </div>
                                    {useKm && (
                                        <div className="space-y-4">
                                            {mode === 'hibrit' && (
                                                <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                                    <button onClick={() => setHibritKmModu('paket')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${hibritKmModu === 'paket' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Her Paket için Km</button>
                                                    <button onClick={() => setHibritKmModu('gunluk')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${hibritKmModu === 'gunluk' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Günlük Toplam Km</button>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Km Ücreti (₺)</label>
                                                    <input type="number" min="0" step="0.5" value={kmFee} onChange={e => setKmFee(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {(mode === 'paket' || (mode === 'hibrit' && hibritKmModu === 'paket')) ? 'Ortalama Mesafe (Paket Başına Km)' : 'Günlük Toplam Mesafe (Km)'}
                                                    </label>
                                                    <input type="number" min="0" step="0.5" value={avgKm} onChange={e => setAvgKm(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-700">
                                        <input type="checkbox" id="izinGunu" checked={izinVar} onChange={e => setIzinVar(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                        <label htmlFor="izinGunu" className="ml-2 text-sm font-medium">İzin günü var (hafta: 6 gün, ay: 26 gün)</label>
                                    </div>

                                    {/* Bonuslar Bölümü */}
                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-8">
                                        <div className="flex items-center justify-between p-4 bg-yellow-50 border-b border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 tracking-tight">Bonus ve Promosyonlar</h3>
                                                    <p className="text-[10px] text-gray-500 font-medium">Verileriniz tarayıcınıza kaydedilir, kaybolmaz.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-6 bg-white">
                                            {/* Günlük Bonus */}
                                            <div>
                                                <div className="flex items-center mb-3">
                                                    <input type="checkbox" id="useDailyBonus" checked={useDailyBonus} onChange={e => setUseDailyBonus(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                                    <label htmlFor="useDailyBonus" className="ml-2 text-sm font-bold text-gray-800 cursor-pointer">Günlük Bonus Hesaplaması</label>
                                                </div>
                                                {useDailyBonus && (
                                                    <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                                                        {dailyBonuses.map(bonus => (
                                                            <div key={bonus.id} className="flex items-center gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Paket Eşiği</label>
                                                                    <input type="number" min="1" value={bonus.packageCount || ''} onChange={e => setDailyBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, packageCount: Number(e.target.value) } : b))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Örn: 30" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bonus Tutarı (₺)</label>
                                                                    <input type="number" min="0" value={bonus.bonusAmount || ''} onChange={e => setDailyBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, bonusAmount: Number(e.target.value) } : b))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Örn: 100" />
                                                                </div>
                                                                <button onClick={() => setDailyBonuses(prev => prev.filter(b => b.id !== bonus.id))} className="mt-5 text-red-500 hover:text-red-700 p-2 transition-transform active:scale-95">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => setDailyBonuses(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), packageCount: 0, bonusAmount: 0 }])} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 active:scale-95 transition-transform">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                            Yeni Günlük Eşik Ekle
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Haftalık Bonus */}
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex items-center mb-3">
                                                    <input type="checkbox" id="useWeeklyBonus" checked={useWeeklyBonus} onChange={e => setUseWeeklyBonus(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                                                    <label htmlFor="useWeeklyBonus" className="ml-2 text-sm font-bold text-gray-800 cursor-pointer">Haftalık Bonus Hesaplaması</label>
                                                </div>
                                                {useWeeklyBonus && (
                                                    <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                                                        {weeklyBonuses.map(bonus => (
                                                            <div key={bonus.id} className="flex items-center gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Haftalık Paket Eşiği</label>
                                                                    <input type="number" min="1" value={bonus.packageCount || ''} onChange={e => setWeeklyBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, packageCount: Number(e.target.value) } : b))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Örn: 200" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bonus Tutarı (₺)</label>
                                                                    <input type="number" min="0" value={bonus.bonusAmount || ''} onChange={e => setWeeklyBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, bonusAmount: Number(e.target.value) } : b))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Örn: 1000" />
                                                                </div>
                                                                <button onClick={() => setWeeklyBonuses(prev => prev.filter(b => b.id !== bonus.id))} className="mt-5 text-red-500 hover:text-red-700 p-2 transition-transform active:scale-95">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => setWeeklyBonuses(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), packageCount: 0, bonusAmount: 0 }])} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 active:scale-95 transition-transform">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                            Yeni Haftalık Eşik Ekle
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sonuç Özeti Bölümü (Detaylı) */}
                                    <div className="bg-blue-50 rounded-xl p-6 shadow-inner border border-blue-100 mt-6 md:mt-8">
                                        <h3 className="text-lg font-black text-blue-900 mb-4 text-center">Tahmini Brüt Kazançlarınız</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center">
                                                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Günlük Kazanç</p>
                                                <p className="text-3xl font-black text-blue-600 mb-3">{formatPrice(results.dailyBrut)}</p>
                                                <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-md w-full">
                                                    {(mode === 'paket' || mode === 'hibrit') ? <span className="block">{Math.round(results.dailyPackageCount)} Paket</span> : <span className="block">{workHours} Saat</span>}
                                                    {results.bonusGunlukBrut > 0 && <span className="block text-green-600 mt-1 font-bold">+{formatPrice(results.bonusGunlukBrut)} Günlük Bonus</span>}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center">
                                                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Haftalık Kazanç</p>
                                                <p className="text-3xl font-black text-blue-600 mb-3">{formatPrice(results.weeklyBrut)}</p>
                                                <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-md w-full">
                                                    {(mode === 'paket' || mode === 'hibrit') ? <span className="block">{Math.round(results.weeklyPackageCount)} Paket</span> : <span className="block">{workHours * results.gunSayisiHaftalik} Saat</span>}
                                                    {results.bonusHaftalikBrut > 0 && <span className="block text-green-600 mt-1 font-bold">+{formatPrice(results.bonusHaftalikBrut)} Haftalık Bonus</span>}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center">
                                                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Aylık Kazanç</p>
                                                <p className="text-3xl font-black text-blue-600 mb-3">{formatPrice(results.monthlyBrut)}</p>
                                                <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-md w-full">
                                                    {(mode === 'paket' || mode === 'hibrit') ? <span className="block">{Math.round(results.monthlyPackageCount)} Paket</span> : <span className="block">{workHours * results.gunSayisiAylik} Saat</span>}
                                                    {(results.bonusGunlukBrut > 0 || results.bonusHaftalikBrut > 0) && <span className="block text-green-600 mt-1 font-bold">Bonuslar Dahil Edildi</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PAKET MODAL */}
                {isSecondPackageModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-2">2. Paket Ücreti Nedir?</h3>
                            <p className="text-sm text-gray-500 mb-4">Bazı platformlarda aynı restorandan arka arkaya sipariş alındığında 2. paket için daha düşük ücret ödenir. Bu oran algoritmamıza Monte Carlo simülasyonu ile dahil edilir.</p>
                            <button onClick={() => setIsSecondPackageModalOpen(false)} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Anladım</button>
                        </div>
                    </div>
                )}
        </div>
    );
}
