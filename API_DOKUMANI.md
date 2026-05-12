# Mesai Takip Sistemi — API Dokümantasyonu

Bu belge, geliştirilen backend API'nin tüm endpoint'lerini, hangi proje isterini karşıladığını ve nasıl kullanılacağını açıklar.

---

## Genel Bilgiler

- **Base URL:** `http://localhost:5000/api`
- **Kimlik Doğrulama:** HTTP-only cookie (`token`) veya `Authorization: Bearer <token>` header'ı
- **İstek/Yanıt Formatı:** JSON

### Personel Durumları

| Durum | Açıklama |
|---|---|
| `mesaiye_baslamadi` | Personel bugün henüz mesai başlatmamış |
| `mesaide` | Personel aktif olarak mesaide |
| `molada` | Personel molada |
| `mesai_bitti` | Personel mesaisini bitirmiş |

---

## 1. Kimlik Doğrulama

### `POST /api/auth/login`

**Karşıladığı İster:** Personel ve yöneticinin sisteme giriş yapabilmesi (Login ekranı)

Sisteme e-posta ve şifre ile giriş yapar. Başarılı girişte JWT token HTTP-only cookie olarak set edilir ve kullanıcı bilgileri döner.

**İstek Gövdesi:**
```json
{
  "email": "personel@sirket.com",
  "password": "sifre123"
}
```

**Başarılı Yanıt — `200 OK`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "full_name": "Ahmet Yılmaz",
    "email": "personel@sirket.com",
    "role": "personel"
  }
}
```

**Hata Yanıtları:**
- `400` — Eksik veya hatalı formatlı alan
- `401` — E-posta veya şifre hatalı

---

### `POST /api/auth/logout`

**Karşıladığı İster:** Kullanıcının güvenli şekilde oturumu kapatması (Temel güvenlik önlemleri)

Cookie'yi temizler ve oturumu sonlandırır. Bu endpoint için giriş yapılmış olmak gerekir.

**Başarılı Yanıt — `200 OK`:**
```json
{
  "message": "Çıkış yapıldı"
}
```

---

## 2. Mesai İşlemleri (Personel)

> Tüm bu endpoint'ler giriş yapmış bir personele aittir. Yönetici de bu endpoint'leri kullanabilir.

---

### `POST /api/shift/start`

**Karşıladığı İster:** Personel → Mesai Başlat

Personelin bugüne ait mesai oturumunu başlatır. Durum `mesaide` olarak ayarlanır ve `mesai_baslat` eventi kaydedilir.

**İş Kuralı:** Aynı gün için ikinci kez mesai başlatılamaz.

**Başarılı Yanıt — `201 Created`:**
```json
{
  "id": 10,
  "user_id": 1,
  "date": "2026-05-12",
  "status": "mesaide",
  "started_at": "2026-05-12T08:00:00.000Z",
  "ended_at": null,
  "total_break_minutes": 0
}
```

**Hata Yanıtları:**
- `401` — Giriş yapılmamış
- `409` — Bugün için zaten mesai kaydı var

---

### `POST /api/shift/break/start`

**Karşıladığı İster:** Personel → Molaya Çık

Personeli molaya çıkarır. Durum `molada` olarak güncellenir ve `mola_baslat` eventi kaydedilir.

**İş Kuralı:** Mesai başlatılmadan molaya çıkılamaz.

**Başarılı Yanıt — `200 OK`:**
```json
{
  "id": 10,
  "status": "molada",
  ...
}
```

**Hata Yanıtları:**
- `400` — Aktif mesai yok veya durum `mesaide` değil
- `401` — Giriş yapılmamış

---

### `POST /api/shift/break/end`

**Karşıladığı İster:** Personel → Moladan Dön

Personeli moladan döndürür. Mola süresi hesaplanarak `total_break_minutes` alanına eklenir. Durum tekrar `mesaide` olur ve `mola_bitis` eventi kaydedilir.

**Bonus İster:** Toplam mola süresi hesaplama

**İş Kuralı:** Yalnızca `molada` durumundayken çağrılabilir.

**Başarılı Yanıt — `200 OK`:**
```json
{
  "id": 10,
  "status": "mesaide",
  "total_break_minutes": 15,
  ...
}
```

**Hata Yanıtları:**
- `400` — Aktif mola bulunamadı
- `401` — Giriş yapılmamış

---

### `POST /api/shift/end`

**Karşıladığı İster:** Personel → Mesai Bitir

Personelin mesaisini sonlandırır. Durum `mesai_bitti` olur, bitiş zamanı kaydedilir ve `mesai_bitir` eventi eklenir.

**İş Kuralları:**
- Moladan dönmeden mesai bitirilemez
- Zaten bitirilmiş mesai tekrar bitirilemez

**Başarılı Yanıt — `200 OK`:**
```json
{
  "id": 10,
  "status": "mesai_bitti",
  "ended_at": "2026-05-12T17:30:00.000Z",
  "total_break_minutes": 45,
  ...
}
```

**Hata Yanıtları:**
- `400` — Molada durumunda / mesai zaten bitirilmiş / aktif mesai yok
- `401` — Giriş yapılmamış

---

### `GET /api/shift/history`

**Karşıladığı İster:** Personel → Kendi günlük hareket geçmişini görüntüleme (Hareket geçmişi ekranı)

Giriş yapan personelin bugüne ait tüm hareket geçmişini sıralı şekilde döner.

**İş Kuralı:** Personel yalnızca kendi kayıtlarını görebilir.

**Başarılı Yanıt — `200 OK`:**
```json
[
  {
    "id": 1,
    "session_id": 10,
    "user_id": 1,
    "event_type": "mesai_baslat",
    "occurred_at": "2026-05-12T08:00:00.000Z"
  },
  {
    "id": 2,
    "event_type": "mola_baslat",
    "occurred_at": "2026-05-12T12:00:00.000Z"
  },
  {
    "id": 3,
    "event_type": "mola_bitis",
    "occurred_at": "2026-05-12T12:45:00.000Z"
  }
]
```

---

## 3. Yönetici Paneli

> Bu endpoint'lere yalnızca `role: "yonetici"` olan kullanıcılar erişebilir.

---

### `GET /api/admin/employees`

**Karşıladığı İster:**
- Yönetici → Personel listesi görüntüleme
- Yönetici → Gün içinde mesaide / molada / mesaisini bitiren personelleri görme (Yönetici dashboard ekranı)
- Yönetici tüm personelleri görüntüleyebilmelidir

Tüm aktif personeli bugünkü anlık durumlarıyla birlikte listeler.

**Başarılı Yanıt — `200 OK`:**
```json
[
  {
    "id": 1,
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet@sirket.com",
    "role": "personel",
    "todayStatus": "mesaide",
    "startedAt": "2026-05-12T08:00:00.000Z",
    "totalBreakMinutes": 15
  },
  {
    "id": 2,
    "full_name": "Ayşe Kaya",
    "email": "ayse@sirket.com",
    "role": "personel",
    "todayStatus": "molada",
    "startedAt": "2026-05-12T09:00:00.000Z",
    "totalBreakMinutes": 0
  },
  {
    "id": 3,
    "full_name": "Mehmet Demir",
    "email": "mehmet@sirket.com",
    "role": "personel",
    "todayStatus": "mesaiye_baslamadi",
    "startedAt": null,
    "totalBreakMinutes": 0
  }
]
```

**Hata Yanıtları:**
- `401` — Giriş yapılmamış
- `403` — Yönetici yetkisi yok

---

### `GET /api/admin/employees/:id/history?period=daily|weekly|monthly`

**Karşıladığı İster:** Yönetici → Personel bazlı günlük / haftalık / aylık hareket geçmişlerini inceleme

Belirli bir personelin seçilen zaman aralığındaki tüm hareket geçmişini döner.

**Query Parametresi:**

| Parametre | Değerler | Varsayılan |
|---|---|---|
| `period` | `daily`, `weekly`, `monthly` | `daily` |

**Örnek İstek:**
```
GET /api/admin/employees/1/history?period=weekly
```

**Başarılı Yanıt — `200 OK`:**
```json
[
  {
    "id": 1,
    "event_type": "mesai_baslat",
    "occurred_at": "2026-05-06T08:10:00.000Z",
    "date": "2026-05-06",
    "session_started": "2026-05-06T08:10:00.000Z",
    "session_ended": "2026-05-06T17:00:00.000Z",
    "total_break_minutes": 30
  }
]
```

**Hata Yanıtları:**
- `401` — Giriş yapılmamış
- `403` — Yönetici yetkisi yok

---

## Proje İster Karşılama Özeti

| Proje İsteri | Karşılayan Endpoint |
|---|---|
| Personel sisteme giriş yapabilmeli | `POST /api/auth/login` |
| Mesai Başlat | `POST /api/shift/start` |
| Molaya Çık | `POST /api/shift/break/start` |
| Moladan Dön | `POST /api/shift/break/end` |
| Mesai Bitir | `POST /api/shift/end` |
| Kendi günlük hareket geçmişi | `GET /api/shift/history` |
| Yönetici personel listesi | `GET /api/admin/employees` |
| Mesaide / molada / biten personeller | `GET /api/admin/employees` (`todayStatus` alanı) |
| Personel bazlı günlük geçmiş | `GET /api/admin/employees/:id/history?period=daily` |
| Personel bazlı haftalık geçmiş | `GET /api/admin/employees/:id/history?period=weekly` |
| Personel bazlı aylık geçmiş | `GET /api/admin/employees/:id/history?period=monthly` |
| Mesai başlatmadan molaya çıkamaz | `shift.service.js` → `startBreak` iş kuralı |
| Moladan dönmeden mesai bitiremez | `shift.service.js` → `endShift` iş kuralı |
| Aynı gün tekrar işlem yapamaz | `shift.service.js` → `startShift` iş kuralı |
| Personel yalnızca kendi kaydını görür | `GET /api/shift/history` — `req.user.id` ile filtrelenir |
| Yönetici tüm personeli görebilir | `GET /api/admin/employees` |
| Toplam mola süresi hesaplama (Bonus) | `POST /api/shift/break/end` — `total_break_minutes` hesaplanır |
