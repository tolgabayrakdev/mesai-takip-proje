import { pool } from '../config/db.js';

export class UserRepository {
  // E-posta adresine göre aktif kullanıcıyı getirir
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return rows[0] || null;
  }

  // ID'ye göre kullanıcıyı getirir (şifre hariç)
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  // Sistemdeki tüm aktif kullanıcıları alfabetik sırayla getirir
  async findAllActive() {
    const { rows } = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE is_active = TRUE ORDER BY full_name'
    );
    return rows;
  }
}
