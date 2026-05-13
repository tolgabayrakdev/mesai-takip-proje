import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './src/config/db.js';

const SALT_ROUNDS = 10;

const users = [
  {
    full_name: 'Admin Kullanıcı',
    email: 'admin@sirket.com',
    password: 'admin123',
    role: 'yonetici',
  },
  {
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet@sirket.com',
    password: 'personel123',
    role: 'personel',
  },
  {
    full_name: 'Ayşe Kaya',
    email: 'ayse@sirket.com',
    password: 'personel123',
    role: 'personel',
  },
];

for (const user of users) {
  const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [user.full_name, user.email, hash, user.role]
  );
  console.log(`✓ ${user.role.padEnd(8)} | ${user.email}`);
}

console.log('\nSeed tamamlandı.');
await pool.end();
