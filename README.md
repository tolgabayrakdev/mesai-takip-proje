# Mesai Takip Projesi(YebSoft)

Çalışanların günlük mesai başlatma, molaya çıkma ve mesai bitirme işlemlerini takip etmeye yarayan bir web uygulamasıdır. Yöneticiler tüm personelin anlık durumunu ve geçmiş mesai kayıtlarını görebilir.

---

## Özellikler

### Personel Paneli

| Özellik | Açıklama |
|---|---|
| Mesai Başlat | Günlük mesai oturumu başlatır; aynı gün ikinci kez başlatılamaz |
| Molaya Çık | Aktif mesai sırasında mola kaydı oluşturur |
| Moladan Dön | Molayı bitirir, geçen süreyi dakika cinsinden hesaplayıp kaydeder |
| Mesai Bitir | Oturumu kapatır; molada çıkılamaz |
| Anlık Durum Kartı | Renk kodlu durum göstergesi ve canlı animasyonlu nokta ile anlık durum |
| Süre Sayacı | Mesai başladıktan itibaren geçen süreyi saat:dakika:saniye olarak gösterir |
| Toplam Mola Süresi | O günkü toplam mola dakikasını durum kartında gösterir |
| Günlük Hareket Geçmişi | Bugün gerçekleştirilen tüm hareketleri saat bilgisiyle listeler |

### Yönetici Paneli

| Özellik | Açıklama |
|---|---|
| Anlık Personel Listesi | Tüm çalışanların mesai durumunu gösterir; her 10 saniyede bir otomatik yenilenir |
| İstatistik Kartları | Mesaide / Molada / Tamamlandı / Başlamadı sayılarını özetler |
| Durum Grupları | Personel listesi aktif, tamamlanmış ve başlamamış olarak ayrı gruplar halinde listelenir |
| Hareket Geçmişi | Personel bazlı günlük, haftalık ve aylık geçmişi gün gün gösterir |
| PDF Rapor İndir | Seçilen periyodun özet istatistiklerini ve günlük detayını tarayıcı print API ile PDF olarak indirir |
| CSV Rapor İndir | Seçilen periyodun verilerini Excel uyumlu `.csv` dosyası olarak indirir (BOM dahil, Türkçe karakter desteği) |

### Güvenlik

| Özellik | Açıklama |
|---|---|
| JWT Kimlik Doğrulama | Token'lar HttpOnly cookie'de saklanır, XSS'e karşı korumalı |
| Bcrypt Şifre Hashleme | Tüm şifreler bcrypt ile hashlenerek veritabanına kaydedilir |
| Rate Limiting | Login endpoint'inde 15 dakikada en fazla 5 deneme hakkı |
| Helmet | HTTP güvenlik başlıkları otomatik eklenir |
| CORS Koruması | Yalnızca izin verilen origin'den gelen istekler kabul edilir |
| Rol Bazlı Yetkilendirme | `personel` ve `yonetici` rolleri; admin endpoint'leri rol kontrolü yapar |
| İş Kuralı Validasyonu | Moladan dönmeden mesai bitiremez, aynı gün iki mesai başlatamaz vb. |
| Joi Schema Validasyonu | Tüm gelen veriler endpoint'e ulaşmadan şema doğrulamasından geçer |

### UI / UX

| Özellik | Açıklama |
|---|---|
| Dark Mode | `next-themes` ile sistem temasına uyumlu koyu/açık mod; kullanıcı tercihini kalıcı olarak saklar |
| Responsive Tasarım | Mobil, tablet ve masaüstü için uyarlanmış düzen |
| Toast Bildirimleri | Her işlem sonucunda `sonner` ile anlık başarı veya hata bildirimi |
| Çıkış Onay Dialog'u | Oturum kapatma işlemi onay dialogu arkasında, kazara çıkışları önler |
| Renk Kodlu Durumlar | Yeşil (mesaide), sarı (molada), mavi (bitti), gri (başlamadı) ile hızlı görsel tarama |
| Canlı Saat | Navbar ve personel panelinde saniye bazlı güncellenen saat göstergesi |

### İş Kuralları

- Personel mesai başlatmadan molaya çıkamaz
- Molada olan personel, moladan dönmeden mesayi bitiremez
- Mesaisi biten personel aynı gün tekrar işlem yapamaz
- Personel yalnızca kendi kayıtlarını görebilir; başka personelin verisine erişemez
- Yönetici tüm personeli görebilir ancak kendi mesai işlemlerini personel gibi yapar

---

## Proje Yapısı

```
mesai-takip-proje/
├── backend/    # Node.js REST API
└── frontend/   # React SPA
```

---

## Backend

### Teknolojiler

| Paket | Açıklama |
|---|---|
| Node.js (ESM) | Çalışma ortamı |
| Express 5 | HTTP framework |
| PostgreSQL + pg | Veritabanı ve sürücüsü |
| bcrypt | Şifre hashleme |
| jsonwebtoken | JWT tabanlı kimlik doğrulama |
| Joi | İstek gövdesi doğrulama (şema bazlı) |
| helmet | HTTP güvenlik başlıkları |
| cors | Cross-Origin kaynak paylaşımı |
| morgan | HTTP istek loglama |
| cookie-parser | Cookie okuma |
| express-rate-limit | Brute-force koruması (login limiter) |
| dotenv | Ortam değişkeni yönetimi |

### Mimari

Katmanlı mimari (Layered Architecture) kullanılmıştır:

```
Routes → Controller → Service → Repository → PostgreSQL
```

- **Routes** — Endpoint tanımları ve middleware zinciri
- **Controller** — HTTP istek/yanıt yönetimi
- **Service** — İş mantığı
- **Repository** — Veritabanı sorguları
- **Middleware** — `authenticate`, `authorize`, `validate`, `errorHandler`
- **Exceptions** — `HttpException`, `UnauthorizedException`, `ValidationException`

### API Endpointleri

#### Auth — `/api/auth`
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/login` | E-posta ve şifre ile giriş, JWT döner |
| GET | `/me` | Oturumdaki kullanıcı bilgisini döner |
| POST | `/logout` | Oturumu sonlandırır |

#### Mesai — `/api/shift` _(JWT gerekli)_
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/start` | Günlük mesaiyi başlatır |
| POST | `/break/start` | Molaya çıkar |
| POST | `/break/end` | Moladan döner, mola süresini hesaplar |
| POST | `/end` | Mesaiyi bitirir |
| GET | `/history` | Bugünkü olayları ve toplam mola süresini döner |

#### Admin — `/api/admin` _(JWT + yönetici rolü gerekli)_
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/employees` | Tüm aktif çalışanları anlık durumlarıyla listeler |
| GET | `/employees/:id` | Belirli bir çalışanın profil bilgisini döner |
| GET | `/employees/:id/history` | Çalışanın mesai olay geçmişini döner |

### Kurulum

```bash
cd backend
npm install
```

`.env` dosyasını oluşturun (`.env.example` dosyasını referans alın):

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/mesai_db
JWT_SECRET=gizli_anahtar
```

```bash
# Geliştirme (hot-reload)
npm run dev

# Üretim
npm start
```

---

## Frontend

### Teknolojiler

| Paket | Açıklama |
|---|---|
| React 19 | UI kütüphanesi |
| TypeScript | Tip güvenliği |
| Vite 8 | Geliştirme sunucusu ve bundler |
| TailwindCSS 4 | Utility-first CSS framework |
| shadcn/ui | Radix UI tabanlı bileşen kütüphanesi |
| Radix UI | Erişilebilir headless bileşenler |
| React Router 7 | İstemci taraflı yönlendirme |
| next-themes | Koyu/açık tema yönetimi |
| sonner | Toast bildirim bileşeni |
| lucide-react | SVG ikon seti |
| clsx + tailwind-merge | Koşullu sınıf birleştirme |
| Inter (variable font) | Yazı tipi |

### Mimari

```
src/
├── components/   # Paylaşılan UI bileşenleri (shadcn + özel)
├── layouts/      # Sayfa iskelet bileşenleri (admin, personel)
├── pages/        # Rota bazlı sayfa bileşenleri
└── lib/          # Yardımcı fonksiyonlar ve konfigürasyon
```

### Roller

- **Personel** — Kendi mesai ve mola işlemlerini yönetir
- **Yönetici** — Tüm personelin anlık durumunu ve geçmişini görüntüler

### Kurulum

```bash
cd frontend
npm install
```

`.env` dosyasını oluşturun (`.env.example` dosyasını referans alın):

```env
VITE_API_URL=http://localhost:5000
```

```bash
# Geliştirme
npm run dev

# Üretim build
npm run build
```

---

## Veritabanı Şeması

PostgreSQL kullanılmaktadır. Şema dosyası: `backend/database.sql`

### Enum Tipleri

| Tip | Değerler | Açıklama |
|---|---|---|
| `user_role` | `personel`, `yonetici` | Kullanıcı rolü |
| `employee_status` | `mesaiye_baslamadi`, `mesaide`, `molada`, `mesai_bitti` | Mesai oturumunun anlık durumu |
| `event_type` | `mesai_baslat`, `mola_baslat`, `mola_bitis`, `mesai_bitir` | Gerçekleşen olayın türü |

### Tablolar

#### `users` — Kullanıcılar

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | SERIAL PK | Birincil anahtar |
| `full_name` | VARCHAR(100) | Ad soyad |
| `email` | VARCHAR(150) UNIQUE | E-posta (benzersiz) |
| `password_hash` | VARCHAR(255) | bcrypt ile hashlenmiş şifre |
| `role` | user_role | Kullanıcı rolü (varsayılan: `personel`) |
| `is_active` | BOOLEAN | Hesap aktiflik durumu (varsayılan: `true`) |
| `created_at` | TIMESTAMPTZ | Kayıt oluşturulma zamanı |

#### `work_sessions` — Günlük Mesai Oturumları

Her personel bir günde en fazla 1 oturum açabilir (`UNIQUE user_id + date`).

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | SERIAL PK | Birincil anahtar |
| `user_id` | INTEGER FK → users | Oturumun sahibi |
| `date` | DATE | Mesainin tarihi (varsayılan: bugün) |
| `status` | employee_status | Anlık durum |
| `started_at` | TIMESTAMPTZ | Mesai başlangıç zamanı |
| `ended_at` | TIMESTAMPTZ | Mesai bitiş zamanı |
| `total_break_minutes` | INTEGER | Toplam mola süresi (dakika) |
| `created_at` | TIMESTAMPTZ | Kayıt oluşturulma zamanı |

#### `events` — Hareket Geçmişi

Tüm mesai olaylarının zaman damgalı kaydıdır. Her aksiyon (mesai başlat, molaya çık vb.) buraya yazılır.

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | SERIAL PK | Birincil anahtar |
| `session_id` | INTEGER FK → work_sessions | Ait olduğu oturum |
| `user_id` | INTEGER FK → users | Olayı gerçekleştiren kullanıcı |
| `event_type` | event_type | Olay türü |
| `occurred_at` | TIMESTAMPTZ | Olayın gerçekleştiği zaman |

### İlişki Diyagramı

```
users (1) ──< work_sessions (N)
                    │
                    └──< events (N)
users (1) ──────────────< events (N)
```


### Veritabanı Kurulumu

```bash
# Şemayı oluştur
psql -U postgres -d mesai_db -f backend/database.sql
```

---

## Geliştirme Ortamı

Backend ve frontend'i aynı anda başlatmak için iki ayrı terminal kullanın:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend varsayılan olarak `http://localhost:5173` adresinde, backend `http://localhost:5000` adresinde çalışır.
