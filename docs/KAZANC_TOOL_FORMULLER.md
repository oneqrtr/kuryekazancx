# KazancTool — Formül ve Hesaplama Detayları

Bu doküman, `components/KazancTool.tsx` içindeki tüm hesaplama formüllerini tek bir yerde toplar. Değişiklik yaparken bu formülleri referans alabilirsiniz.

---

## 0. Net tanımlar ve sabitler (kodda standart)

- **KDV_ORANI** = 0.20 (ileride seçenekli yapılabilir)
- **TEVKIFAT_ORANI** = 0.20
- **matrahGunluk** = KDV hariç günlük gelir (platform geliri + varsa km geliri + bonuslar); platform kesintisi uygulandıktan sonra
- **kdvGunluk** = matrahGunluk × KDV_ORANI
- **tahsilatGunluk** = matrahGunluk + kdvGunluk (KDV dahil tahsilat gösterimi)
- **tevkifatGunluk** = kdvGunluk × TEVKIFAT_ORANI (tevkifat uygulanıyorsa)
- **kuryeKdvYuku** = kdvGunluk − tevkifatGunluk (esnafın cebinden çıkan KDV)
- **Net (Net-1)** = matrahGunluk − kuryeKdvYuku − diğer kesintiler (yakıt vb.)
- **platformKesintiOrani** = 0–100 slider; matrah = baz gelir × (1 − platformKesintiOrani/100)

Tüm hesaplama önce KDV hariç matrahta yapılır. `kdvDahil` sadece girdi dönüşümü için kullanılır: KDV dahil girilmişse `perPackageKdvHaric = perPackageKdvDahil / (1 + KDV_ORANI)`.

---

## 1. Girdiler (Inputs)

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `workHours` | Günlük çalışma saati | 10 |
| `ordersPerHour` | Saatte ortalama sipariş (paket modunda) | 4 |
| `pkgFeeInput` | Paket başına ücret (₺), KDV dahil/hariç seçilebilir | 80 |
| `secondPackageFeeInput` | 2. paket ücreti (₺) | 70 |
| `kdvDahil` | Ücretler KDV dahil mi? (sadece girdi dönüşümü) | false |
| `useKm` | Km ücreti dahil mi? | false |
| `kmFee` | Km başına ücret (₺) | 5 |
| `avgKm` | Ortalama mesafe (km) | 5 |
| `mode` | `'paket'` veya `'saat'` | 'paket' |
| `hourlyFee` | Saatlik ücret (₺), saat modunda | 170 |
| `saatlikHesapTipi` | `'saatlikten'` veya `'toplamdan'` | 'saatlikten' |
| `aylikToplamUcret` | Aylık maaş hedefi (₺), toplamdan modunda | 44200 |
| `izinVar` | İzinli çalışma (26 gün/ay)? false ise 30 gün | true → 26 gün |
| `platformKesintiOrani` | Platform kesintisi (%) 0–30; matrah = baz × (1 − oran/100) | 20 |
| `tevkifatUygula` | Tevkifat uygula (KDV'nin %20'si) | false |
| `fuelCostPerDay` | Günlük yakıt gideri (₺) | 0 |
| `dailyBonuses` | Günlük bonus kuralları: `{ packageCount, bonusAmount }[]` | [] |
| `weeklyBonuses` | Haftalık bonus kuralları: `{ packageCount, bonusAmount }[]` | [] |

**Giderler bölümü (accordion):**

| Değişken | Açıklama |
|----------|----------|
| `consumptionL100` | Motor tüketimi (L/100 km) — şu an sadece bilgi, net hesaba katılmıyor |
| `gunlukKmOverride` | Günlük km (boşsa paket×avgKm kullanılır) |
| `maintenanceCostPer3000km` | Her 3000 km'de bakım maliyeti (₺) |
| `yemekGideri` | Yemek gideri (₺) |
| `yemekGideriAylikMi` | true = aylık, false = günlük |
| `muhasebeGideriAylik` | Aylık muhasebe gideri (₺) |

---

## 2. Yardımcı sabitler

- **Gün sayıları (izinVar’a göre):**
  - `gunSayisiHaftalik` = izinVar ? **6** : **7**
  - `gunSayisiAylik` = izinVar ? **26** : **30**
  - `aydakiHaftaSayisi` = gunSayisiAylik / gunSayisiHaftalik

- **KDV oranı:** Sabit **KDV_ORANI = 0.20**. Girdi KDV dahilse: **/ (1 + KDV_ORANI)** ile matraha çevrilir.

---

## 3. Paket başına ücret (KDV hariç)

### 3.1 İkinci paket yok

```
pkgFee = kdvDahil ? (pkgFeeInput / 1.20) : pkgFeeInput
perPackageKDVHaric = pkgFee
```

### 3.2 İkinci paket var — Monte Carlo (paket başı ortalama)

**Dağılım (teslimat başına paket sayısı):**

| Paket sayısı | Olasılık |
|--------------|----------|
| 1 | 0.60 |
| 2 | 0.25 |
| 3 | 0.10 |
| 4 | 0.05 |

**Tek iterasyon:**

1. Rastgele 1–4 paket seç (yukarıdaki olasılıklarla).
2. **Teslimat geliri (KDV hariç):**
   - `pkgFee` = KDV hariç 1. paket ücreti
   - `secondPackageFee` = KDV hariç 2. paket ücreti
   - `totalEarningsForDelivery = pkgFee + (packageCount >= 2 ? secondPackageFee * (packageCount - 1) : 0)`
   - Km dahilse: `totalEarningsForDelivery += kmFee * avgKm`
3. **Paket başı kazanç:** `perPackageEarnings = totalEarningsForDelivery / packageCount`

**1000 iterasyon sonrası:**

- `avgPerPackageKDVHaric` = toplam paket başı kazanç / 1000
- KDV dahil gösterim için: `avgPerPackageBrut = kdvDahil ? (avgPerPackageKDVHaric * 1.20) : avgPerPackageKDVHaric`
- Sonuç `perPackageKDVHaric` olarak kullanılıyor; eğer kdvDahil ise bir kez daha `/ 1.20` ile KDV hariçe çevriliyor.

---

## 4. Saat modu — saatlik ücret türetme

**“Aylık maaştan ücrete” (toplamdan) seçiliyse:**

- `totalDays` = izinVar ? **26** : **30**
- Günlük hedef (KDV hariç):  
  `targetDailyKDVHaric = kdvDahil ? (aylikToplamUcret / totalDays) / 1.20 : (aylikToplamUcret / totalDays)`
- `dailyKmEarnings` = useKm ? **(kmFee × avgKm)** : **0**
- **Hesaplanan saatlik ücret:**  
  `actualHourlyFee = (targetDailyKDVHaric - dailyKmEarnings) / workHours`  
  (negatifse 0 yapılır.)

“Saatlik ücretten maaşa” seçiliyse `actualHourlyFee = hourlyFee` (kullanıcı girişi).

---

## 5. Günlük brüt (günlük KDV hariç baz)

**Paket modu:**

- `dailyKmEarnings` = (sadece saat modunda km varsa) `kmFee * avgKm`; paket modunda bu blokta 0.
- `hourlyEarnings` = 0.
- `packageEarningsKDVHaric` = **perPackageKDVHaric × ordersPerHour × workHours**
- **baseDailyKDVHaric** = packageEarningsKDVHaric + hourlyEarnings

**Saat modu:**

- `dailyKmEarnings` = useKm ? **(kmFee × avgKm)** : **0**
- `hourlyEarnings` = **(actualHourlyFee × workHours) + dailyKmEarnings**
- `packageEarningsKDVHaric` = 0.
- **baseDailyKDVHaric** = hourlyEarnings

---

## 6. Paket sayıları

- **dailyPackageCount** = ordersPerHour × workHours
- **weeklyPackageCount** = dailyPackageCount × gunSayisiHaftalik  (6 veya 7)
- **monthlyPackageCount** = dailyPackageCount × gunSayisiAylik   (26 veya 30)

---

## 7. Bonuslar (sadece paket modu)

**Günlük bonus:**

- Günlük paket ≥ kural.packageCount olan tüm kurallar alınır.
- Bunlar arasında **en yüksek bonusAmount** seçilir.
- `dailyBonusKDVHaric` = kdvDahil ? **(maxBonus / 1.20)** : **maxBonus**

**Haftalık bonus:**

- Haftalık paket ≥ kural.packageCount olan tüm kurallar alınır.
- **En yüksek bonusAmount** alınır.
- `weeklyBonusKDVHaric` = kdvDahil ? **(maxBonus / 1.20)** : **maxBonus**

**Günlük KDV hariç toplam:**

- **finalDailyKDVHaric** = baseDailyKDVHaric + dailyBonusKDVHaric

**Brüt (KDV dahil ise ×1.20):**

- **dailyBrutVal** = kdvDahil ? **(finalDailyKDVHaric × 1.20)** : **finalDailyKDVHaric**

---

## 8. Haftalık ve aylık brüt

- **weeklyBaseBrut** = dailyBrutVal × gunSayisiHaftalik
- **weeklyBonusBrut** = kdvDahil ? (weeklyBonusKDVHaric × 1.20) : weeklyBonusKDVHaric
- **weeklyBrutVal** = weeklyBaseBrut + weeklyBonusBrut

- **monthlyBrutVal** = (dailyBrutVal × gunSayisiAylik) + (weeklyBonusBrut × aydakiHaftaSayisi)

---

## 9. KDV kesintisi

- **dailyKDVVal** = (finalDailyKDVHaric × vergiKesinti) / 100

- **weeklyKDVHaric** = (finalDailyKDVHaric × gunSayisiHaftalik) + weeklyBonusKDVHaric  
- **weeklyKDVVal** = (weeklyKDVHaric × vergiKesinti) / 100

- **monthlyKDVHaric** = (finalDailyKDVHaric × gunSayisiAylik) + (weeklyBonusKDVHaric × aydakiHaftaSayisi)  
- **monthlyKDVVal** = (monthlyKDVHaric × vergiKesinti) / 100

---

## 10. Tevfikat (KDV’nin %20’si)

- **dailyTevfikatVal** = tevfikat ? **(dailyKDVVal × 20) / 100** : **0**
- **weeklyTevfikatVal** = tevfikat ? **(weeklyKDVVal × 20) / 100** : **0**
- **monthlyTevfikatVal** = tevfikat ? **(monthlyKDVVal × 20) / 100** : **0**

---

## 11. Net kazanç (kesinti sonrası, yakıt dahil)

Yakıt gideri günlük sabit: **fuelCostPerDay** (₺).

- **dailyNetVal** = dailyBrutVal − dailyKDVVal − dailyTevfikatVal − **fuelCostPerDay**

- **weeklyNetVal** = weeklyBrutVal − weeklyKDVVal − weeklyTevfikatVal − **(fuelCostPerDay × gunSayisiHaftalik)**  
  (gunSayisiHaftalik = 6 veya 7)

- **monthlyNetVal** = monthlyBrutVal − monthlyKDVVal − monthlyTevfikatVal − **(fuelCostPerDay × gunSayisiAylik)**  
  (gunSayisiAylik = 26 veya 30)

---

## 12. “Giderler çıkarsa ne olur?” — Son net

**Günlük km:**

- **gunlukKm** = (gunlukKmOverride doluysa) **gunlukKmOverride**  
  değilse: paket modunda **dailyPackageCount × avgKm**, saat modunda **0**.

**Günlük gider payları:**

1. **Bakım (günlük pay):**  
   - **bakimGunluk** = gunlukKm > 0 ise **(gunlukKm / 3000) × maintenanceCostPer3000km**, değilse **0**.

2. **Yemek (günlük):**  
   - **yemekGunluk** = yemekGideriAylikMi ? **(yemekGideri / 30)** : **yemekGideri**

3. **Muhasebe (günlük):**  
   - **muhasebeGunluk** = **muhasebeGideriAylik / 30**

**Toplam günlük ek gider:**

- **toplamGiderGunluk** = bakimGunluk + yemekGunluk + muhasebeGunluk

**Giderler sonrası net:**

- **netGunluk** = results.dailyNet − toplamGiderGunluk  
- **netHaftalik** = results.weeklyNet − (toplamGiderGunluk × gunSayisiHaftalik)
- **netAylik** = results.monthlyNet − (toplamGiderGunluk × gunSayisiAylik)

*(Not: Haftalık net’te 7, aylık net’te 30 ile çarpım kullanılıyor; izinVar’a göre 6/26 kullanılmıyor. İsterseniz tutarlılık için gunSayisiHaftalik ve gunSayisiAylik ile değiştirilebilir.)*

---

## 13. Gösterim (format)

- Para: `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })`  
  → Tam sayıya yuvarlanmış TRY.
- Paket sayıları: `Number(...).toLocaleString('tr-TR')`.

---

## 14. Özet formül listesi (kopyala-yapıştır)

```
// Gün sayıları
gunSayisiHaftalik = izinVar ? 6 : 7
gunSayisiAylik    = izinVar ? 26 : 30
aydakiHaftaSayisi = gunSayisiAylik / gunSayisiHaftalik

// Paket modu - paket başı (ikinci paket yok)
perPackageKDVHaric = kdvDahil ? (pkgFeeInput/1.20) : pkgFeeInput

// Saat modu - toplamdan saatlik
targetDailyKDVHaric = kdvDahil ? (aylikToplamUcret/totalDays)/1.20 : (aylikToplamUcret/totalDays)
actualHourlyFee = max(0, (targetDailyKDVHaric - (useKm? kmFee*avgKm : 0)) / workHours)

// Günlük baz
dailyPackageCount = ordersPerHour * workHours
baseDailyKDVHaric = paket modu: perPackageKDVHaric*dailyPackageCount + (saat: actualHourlyFee*workHours + km)
finalDailyKDVHaric = baseDailyKDVHaric + dailyBonusKDVHaric
dailyBrutVal = kdvDahil ? finalDailyKDVHaric*1.20 : finalDailyKDVHaric

// Haftalık/Aylık brüt
weeklyBrutVal  = dailyBrutVal*gunSayisiHaftalik + weeklyBonusBrut
monthlyBrutVal = dailyBrutVal*gunSayisiAylik + weeklyBonusBrut*aydakiHaftaSayisi

// KDV
dailyKDVVal   = finalDailyKDVHaric * vergiKesinti/100
weeklyKDVVal  = weeklyKDVHaric * vergiKesinti/100
monthlyKDVVal = monthlyKDVHaric * vergiKesinti/100

// Tevfikat
dailyTevfikatVal   = tevfikat ? dailyKDVVal*0.20 : 0
weeklyTevfikatVal  = tevfikat ? weeklyKDVVal*0.20 : 0
monthlyTevfikatVal = tevfikat ? monthlyKDVVal*0.20 : 0

// Net (yakıt dahil)
dailyNetVal   = dailyBrutVal - dailyKDVVal - dailyTevfikatVal - fuelCostPerDay
weeklyNetVal  = weeklyBrutVal - weeklyKDVVal - weeklyTevfikatVal - fuelCostPerDay*gunSayisiHaftalik
monthlyNetVal = monthlyBrutVal - monthlyKDVVal - monthlyTevfikatVal - fuelCostPerDay*gunSayisiAylik

// Giderler sonrası net
gunlukKm = gunlukKmOverride ?? (paket ? dailyPackageCount*avgKm : 0)
bakimGunluk = gunlukKm>0 ? (gunlukKm*30/3000)*maintenanceCostPer3000km/30 : 0
yemekGunluk = yemekGideriAylikMi ? yemekGideri/30 : yemekGideri
muhasebeGunluk = muhasebeGideriAylik/30
toplamGiderGunluk = bakimGunluk + yemekGunluk + muhasebeGunluk
netGunluk  = dailyNetVal - toplamGiderGunluk
netHaftalik = weeklyNetVal - toplamGiderGunluk*gunSayisiHaftalik
netAylik   = monthlyNetVal - toplamGiderGunluk*gunSayisiAylik
```

Bu dokümandaki formülleri değiştirdikten sonra aynı mantığı `KazancTool.tsx` içindeki `useEffect` ve “Giderler” blokunda güncellemeniz yeterli.
