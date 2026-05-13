-- YebSoft Mesai Takip Sistemi - Seed Verileri
-- Çalıştırmak için: psql -U postgres -d mesai_db -f seed.sql

-- Kullanıcılar
-- Şifreler bcrypt ile hashlenmiştir.
-- admin@sirket.com    → admin123
-- ahmet@sirket.com   → personel123
-- ayse@sirket.com    → personel123

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin Kullanıcı', 'admin@sirket.com',  '$2b$10$f7R8YjzRtmPVY9Gx4JgpFOj.uXNB.Zh/WQfVGiIDBYV68QT.TOhbG', 'yonetici'),
  ('Ahmet Yılmaz',    'ahmet@sirket.com',  '$2b$10$7iZajb5hXiUlHlDTuE/K7O5BIXbLnugLotN2jWAZCMOiT.GXNFwRC', 'personel'),
  ('Ayşe Kaya',       'ayse@sirket.com',   '$2b$10$7iZajb5hXiUlHlDTuE/K7O5BIXbLnugLotN2jWAZCMOiT.GXNFwRC', 'personel')
ON CONFLICT (email) DO NOTHING;

-- Ahmet Yılmaz (user_id = 2) — Son 5 günün mesai kayıtları
INSERT INTO work_sessions (user_id, date, status, started_at, ended_at, total_break_minutes) VALUES
  (2, CURRENT_DATE - 1, 'mesai_bitti', CURRENT_DATE - 1 + TIME '08:30', CURRENT_DATE - 1 + TIME '17:45', 45),
  (2, CURRENT_DATE - 2, 'mesai_bitti', CURRENT_DATE - 2 + TIME '09:00', CURRENT_DATE - 2 + TIME '18:00', 30),
  (2, CURRENT_DATE - 3, 'mesai_bitti', CURRENT_DATE - 3 + TIME '08:45', CURRENT_DATE - 3 + TIME '17:30', 60),
  (2, CURRENT_DATE - 4, 'mesai_bitti', CURRENT_DATE - 4 + TIME '09:15', CURRENT_DATE - 4 + TIME '18:15', 35),
  (2, CURRENT_DATE - 5, 'mesai_bitti', CURRENT_DATE - 5 + TIME '08:30', CURRENT_DATE - 5 + TIME '17:00', 50);

-- Ahmet — olaylar
INSERT INTO events (session_id, user_id, event_type, occurred_at)
SELECT s.id, 2, e.event_type, s.date + e.t
FROM work_sessions s
JOIN (VALUES
  (1, 'mesai_baslat'::event_type, TIME '08:30'),
  (1, 'mola_baslat'::event_type,  TIME '12:00'),
  (1, 'mola_bitis'::event_type,   TIME '12:45'),
  (1, 'mesai_bitir'::event_type,  TIME '17:45'),
  (2, 'mesai_baslat'::event_type, TIME '09:00'),
  (2, 'mola_baslat'::event_type,  TIME '12:30'),
  (2, 'mola_bitis'::event_type,   TIME '13:00'),
  (2, 'mesai_bitir'::event_type,  TIME '18:00'),
  (3, 'mesai_baslat'::event_type, TIME '08:45'),
  (3, 'mola_baslat'::event_type,  TIME '12:15'),
  (3, 'mola_bitis'::event_type,   TIME '13:15'),
  (3, 'mesai_bitir'::event_type,  TIME '17:30'),
  (4, 'mesai_baslat'::event_type, TIME '09:15'),
  (4, 'mola_baslat'::event_type,  TIME '13:00'),
  (4, 'mola_bitis'::event_type,   TIME '13:35'),
  (4, 'mesai_bitir'::event_type,  TIME '18:15'),
  (5, 'mesai_baslat'::event_type, TIME '08:30'),
  (5, 'mola_baslat'::event_type,  TIME '12:00'),
  (5, 'mola_bitis'::event_type,   TIME '12:50'),
  (5, 'mesai_bitir'::event_type,  TIME '17:00')
) AS e(offset_day, event_type, t) ON s.date = CURRENT_DATE - e.offset_day
WHERE s.user_id = 2;

-- Ayşe Kaya (user_id = 3) — Son 4 günün mesai kayıtları
INSERT INTO work_sessions (user_id, date, status, started_at, ended_at, total_break_minutes) VALUES
  (3, CURRENT_DATE - 1, 'mesai_bitti', CURRENT_DATE - 1 + TIME '09:00', CURRENT_DATE - 1 + TIME '18:30', 40),
  (3, CURRENT_DATE - 2, 'mesai_bitti', CURRENT_DATE - 2 + TIME '08:45', CURRENT_DATE - 2 + TIME '17:30', 55),
  (3, CURRENT_DATE - 3, 'mesai_bitti', CURRENT_DATE - 3 + TIME '09:30', CURRENT_DATE - 3 + TIME '18:00', 30),
  (3, CURRENT_DATE - 4, 'mesai_bitti', CURRENT_DATE - 4 + TIME '08:30', CURRENT_DATE - 4 + TIME '17:15', 45);

-- Ayşe — olaylar
INSERT INTO events (session_id, user_id, event_type, occurred_at)
SELECT s.id, 3, e.event_type, s.date + e.t
FROM work_sessions s
JOIN (VALUES
  (1, 'mesai_baslat'::event_type, TIME '09:00'),
  (1, 'mola_baslat'::event_type,  TIME '12:30'),
  (1, 'mola_bitis'::event_type,   TIME '13:10'),
  (1, 'mesai_bitir'::event_type,  TIME '18:30'),
  (2, 'mesai_baslat'::event_type, TIME '08:45'),
  (2, 'mola_baslat'::event_type,  TIME '12:00'),
  (2, 'mola_bitis'::event_type,   TIME '12:55'),
  (2, 'mesai_bitir'::event_type,  TIME '17:30'),
  (3, 'mesai_baslat'::event_type, TIME '09:30'),
  (3, 'mola_baslat'::event_type,  TIME '13:00'),
  (3, 'mola_bitis'::event_type,   TIME '13:30'),
  (3, 'mesai_bitir'::event_type,  TIME '18:00'),
  (4, 'mesai_baslat'::event_type, TIME '08:30'),
  (4, 'mola_baslat'::event_type,  TIME '12:15'),
  (4, 'mola_bitis'::event_type,   TIME '13:00'),
  (4, 'mesai_bitir'::event_type,  TIME '17:15')
) AS e(offset_day, event_type, t) ON s.date = CURRENT_DATE - e.offset_day
WHERE s.user_id = 3;
