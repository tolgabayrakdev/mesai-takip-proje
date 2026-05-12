import { pool } from '../config/db.js';

export class EventRepository {
  // Oturuma yeni bir hareket kaydı ekler
  async createEvent(sessionId, userId, eventType) {
    const { rows } = await pool.query(
      `INSERT INTO events (session_id, user_id, event_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, userId, eventType]
    );
    return rows[0];
  }

  // Belirtilen oturumdaki en son gerçekleşen hareket tipini getirir
  async findLastEvent(sessionId, eventType) {
    const { rows } = await pool.query(
      `SELECT * FROM events
       WHERE session_id = $1 AND event_type = $2
       ORDER BY occurred_at DESC
       LIMIT 1`,
      [sessionId, eventType]
    );
    return rows[0] || null;
  }

  // Kullanıcının bugüne ait tüm hareket geçmişini sıralı getirir
  async findTodayEvents(userId) {
    const { rows } = await pool.query(
      `SELECT e.*
       FROM events e
       JOIN work_sessions ws ON ws.id = e.session_id
       WHERE e.user_id = $1 AND ws.date = CURRENT_DATE
       ORDER BY e.occurred_at`,
      [userId]
    );
    return rows;
  }

  // Kullanıcının belirtilen periyottaki (günlük/haftalık/aylık) hareket geçmişini getirir
  async findEventsByPeriod(userId, period) {
    const intervals = {
      weekly:  `ws.date >= CURRENT_DATE - INTERVAL '7 days'`,
      monthly: `ws.date >= CURRENT_DATE - INTERVAL '30 days'`,
      daily:   `ws.date = CURRENT_DATE`,
    };
    const dateFilter = intervals[period] ?? intervals.daily;

    const { rows } = await pool.query(
      `SELECT e.*, ws.date, ws.total_break_minutes,
              ws.started_at AS session_started,
              ws.ended_at   AS session_ended
       FROM events e
       JOIN work_sessions ws ON ws.id = e.session_id
       WHERE e.user_id = $1 AND ${dateFilter}
       ORDER BY e.occurred_at`,
      [userId]
    );
    return rows;
  }
}
