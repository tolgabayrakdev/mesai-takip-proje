import { pool } from '../config/db.js';

export class SessionRepository {
  // Kullanıcının bugüne ait oturumunu getirir
  async findTodaySession(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM work_sessions WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );
    return rows[0] || null;
  }

  // Kullanıcı için yeni bir mesai oturumu oluşturur ve durumu 'mesaide' olarak ayarlar
  async createSession(userId) {
    const { rows } = await pool.query(
      `INSERT INTO work_sessions (user_id, status, started_at)
       VALUES ($1, 'mesaide', NOW())
       RETURNING *`,
      [userId]
    );
    return rows[0];
  }

  // Belirtilen oturumun durumunu günceller
  async updateSessionStatus(sessionId, status) {
    const { rows } = await pool.query(
      'UPDATE work_sessions SET status = $1 WHERE id = $2 RETURNING *',
      [status, sessionId]
    );
    return rows[0];
  }

  // Oturumun toplam mola süresine verilen dakikayı ekler
  async addBreakMinutes(sessionId, minutes) {
    const { rows } = await pool.query(
      'UPDATE work_sessions SET total_break_minutes = total_break_minutes + $1 WHERE id = $2 RETURNING *',
      [minutes, sessionId]
    );
    return rows[0];
  }

  // Oturumu bitirir: durumu 'mesai_bitti' yapar ve bitiş zamanını kaydeder
  async endSession(sessionId) {
    const { rows } = await pool.query(
      `UPDATE work_sessions SET status = 'mesai_bitti', ended_at = NOW() WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    return rows[0];
  }

  // Bugün oturumu olan tüm kullanıcıları kullanıcı bilgileriyle birlikte getirir
  async findAllTodaySessions() {
    const { rows } = await pool.query(
      `SELECT ws.*, u.full_name, u.email
       FROM work_sessions ws
       JOIN users u ON u.id = ws.user_id
       WHERE ws.date = CURRENT_DATE
       ORDER BY ws.started_at`
    );
    return rows;
  }
}
