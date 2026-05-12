-- YebSoft Mesai Takip Sistemi - Database Schema

-- Enum types
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

-- Users table
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         user_role NOT NULL DEFAULT 'personel',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily work sessions table
-- Each employee can have at most 1 session per day
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

-- Event history table
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  session_id   INTEGER NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type   event_type NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_sessions_user ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_date ON work_sessions(date);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);

