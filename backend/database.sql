-- YebSoft Mesai Takip Sistemi - Database Schema

-- Enum tipleri
CREATE TYPE user_role AS ENUM ('personel', 'yonetici');

CREATE TYPE employee_status AS ENUM (
  'mesaiye_baslamadi',
  'mesaide',
  'molada',
  'mesai_bitti'
);

CREATE TYPE event_type AS ENUM (
  'mesai_baslat',
  'mola_baslat',
  'mola_bitis',
  'mesai_bitir'
);

-- Kullanıcılar tablosu
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         user_role NOT NULL DEFAULT 'personel',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Günlük mesai oturumları tablosu
-- Her personel bir günde en fazla 1 oturum açabilir
CREATE TABLE work_sessions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  status          employee_status NOT NULL DEFAULT 'mesaiye_baslamadi',
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  total_break_minutes INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_session_per_day UNIQUE (user_id, date)
);

-- Hareket geçmişi tablosu
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  session_id   INTEGER NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type   event_type NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_work_sessions_user ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_date ON work_sessions(date);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);

-- ============================================
-- SEED VERİLERİ
-- ============================================

-- Ahmet Yılmaz (user_id = 2) - Son 5 günün kayıtları
INSERT INTO work_sessions (user_id, date, status, started_at, ended_at, total_break_minutes) VALUES
(2, CURRENT_DATE - INTERVAL '1 day', 'mesai_bitti', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '8:30', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17:45', 45),
(2, CURRENT_DATE - INTERVAL '2 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '18:00', 30),
(2, CURRENT_DATE - INTERVAL '3 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '8:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:30', 60),
(2, CURRENT_DATE - INTERVAL '4 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '9:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', 35),
(2, CURRENT_DATE - INTERVAL '5 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '8:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:00', 50);

-- Ahmet - 1 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '1 day'), 2, 'mesai_baslat', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '8:30'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '1 day'), 2, 'mola_baslat', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12:00'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '1 day'), 2, 'mola_bitis', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12:45'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '1 day'), 2, 'mesai_bitir', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17:45');

-- Ahmet - 2 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '2 days'), 2, 'mesai_baslat', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9:00'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '2 days'), 2, 'mola_baslat', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '12:30'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '2 days'), 2, 'mola_bitis', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '13:00'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '2 days'), 2, 'mesai_bitir', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '18:00');

-- Ahmet - 3 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '3 days'), 2, 'mesai_baslat', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '8:45'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '3 days'), 2, 'mola_baslat', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '12:15'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '3 days'), 2, 'mola_bitis', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '13:15'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '3 days'), 2, 'mesai_bitir', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:30');

-- Ahmet - 4 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '4 days'), 2, 'mesai_baslat', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '9:15'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '4 days'), 2, 'mola_baslat', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '13:00'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '4 days'), 2, 'mola_bitis', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '13:35'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '4 days'), 2, 'mesai_bitir', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15');

-- Ahmet - 5 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '5 days'), 2, 'mesai_baslat', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '8:30'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '5 days'), 2, 'mola_baslat', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '12:00'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '5 days'), 2, 'mola_bitis', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '12:50'),
((SELECT id FROM work_sessions WHERE user_id = 2 AND date = CURRENT_DATE - INTERVAL '5 days'), 2, 'mesai_bitir', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:00');

-- Ayşe Kaya (user_id = 3) - Son 4 günün kayıtları
INSERT INTO work_sessions (user_id, date, status, started_at, ended_at, total_break_minutes) VALUES
(3, CURRENT_DATE - INTERVAL '1 day', 'mesai_bitti', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '9:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:30', 40),
(3, CURRENT_DATE - INTERVAL '2 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '8:45', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:30', 55),
(3, CURRENT_DATE - INTERVAL '3 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '9:30', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '18:00', 30),
(3, CURRENT_DATE - INTERVAL '4 days', 'mesai_bitti', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '8:30', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '17:15', 45);

-- Ayşe - 1 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '1 day'), 3, 'mesai_baslat', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '9:00'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '1 day'), 3, 'mola_baslat', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12:30'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '1 day'), 3, 'mola_bitis', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '13:10'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '1 day'), 3, 'mesai_bitir', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:30');

-- Ayşe - 2 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '2 days'), 3, 'mesai_baslat', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '8:45'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '2 days'), 3, 'mola_baslat', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '12:00'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '2 days'), 3, 'mola_bitis', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '12:55'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '2 days'), 3, 'mesai_bitir', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:30');

-- Ayşe - 3 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '3 days'), 3, 'mesai_baslat', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '9:30'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '3 days'), 3, 'mola_baslat', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '13:00'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '3 days'), 3, 'mola_bitis', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '13:30'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '3 days'), 3, 'mesai_bitir', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '18:00');

-- Ayşe - 4 gün önce events
INSERT INTO events (session_id, user_id, event_type, occurred_at) VALUES
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '4 days'), 3, 'mesai_baslat', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '8:30'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '4 days'), 3, 'mola_baslat', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '12:15'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '4 days'), 3, 'mola_bitis', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '13:00'),
((SELECT id FROM work_sessions WHERE user_id = 3 AND date = CURRENT_DATE - INTERVAL '4 days'), 3, 'mesai_bitir', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '17:15');

