# Mesai Takip Sistemi — Backend

## Kullanılan Teknolojiler

- **Node.js** — Çalışma ortamı
- **Express.js** — Web framework
- **PostgreSQL** — Veritabanı
- **pg** — PostgreSQL bağlantı kütüphanesi
- **bcrypt** — Şifre hashleme
- **jsonwebtoken** — JWT kimlik doğrulama
- **Joi** — İstek validasyonu
- **helmet** — HTTP güvenlik başlıkları
- **cors** — Cross-origin kaynak paylaşımı
- **morgan** — HTTP istek loglama
- **cookie-parser** — Cookie yönetimi
- **dotenv** — Ortam değişkenleri

## Kurulum

**1. Bağımlılıkları yükle**
```bash
npm install
```

**2. Ortam değişkenlerini ayarla**
```bash
cp .env.example .env
```
`.env` dosyasını aç ve değerleri doldur:
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/mesai_takip
JWT_SECRET=gizli_anahtar
CORS_ORIGIN=http://localhost:5173
```

**3. Veritabanını oluştur**
```bash
psql -U kullanici -d mesai_takip -f database.sql
```

**4. Sunucuyu başlat**
```bash
# Geliştirme
npm run dev

# Prodüksiyon
npm start
```

Sunucu varsayılan olarak `http://localhost:5000` adresinde çalışır.

@tolgabayrak
