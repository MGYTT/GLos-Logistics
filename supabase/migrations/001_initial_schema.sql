-- RANGI PROGI
CREATE TABLE IF NOT EXISTS rank_thresholds (
  rank TEXT PRIMARY KEY,
  min_points INTEGER,
  min_jobs INTEGER,
  min_distance_km INTEGER
);

-- CZŁONKOWIE
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  steam_id TEXT UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  rank TEXT DEFAULT 'Recruit' CHECK (rank IN ('Recruit','Driver','Senior','Elite','Manager','Owner')),
  points INTEGER DEFAULT 0,
  truckershub_id TEXT,
  discord_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE
);

-- JOBY
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  origin_city TEXT,
  destination_city TEXT,
  distance_km INTEGER DEFAULT 0,
  income BIGINT DEFAULT 0,
  fuel_used REAL DEFAULT 0,
  damage_percent REAL DEFAULT 0,
  truckershub_job_id TEXT UNIQUE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- POZYCJE KIEROWCÓW (real-time)
CREATE TABLE IF NOT EXISTS driver_positions (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  x REAL DEFAULT 0,
  y REAL DEFAULT 0,
  z REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  game_time TEXT,
  online BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FLOTA
CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  livery_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL
);

-- WYDARZENIA
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  bonus_points INTEGER DEFAULT 0,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL
);

-- RSVP WYDARZEŃ
CREATE TABLE IF NOT EXISTS event_rsvp (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, member_id)
);

-- PODANIA REKRUTACYJNE
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  steam_id TEXT NOT NULL,
  discord_tag TEXT NOT NULL,
  truckershub_id TEXT,
  ets2_hours INTEGER NOT NULL,
  motivation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REAL-TIME PUBLIKACJA
ALTER PUBLICATION supabase_realtime ADD TABLE driver_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE members;

-- WŁĄCZ RLS
ALTER TABLE members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvp       ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications     ENABLE ROW LEVEL SECURITY;