-- ═════════════════════════════════════════════════════════════════════════════
-- S-BAHN WERKSTATT TOOL — Supabase Database Schema
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- USERS
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  password text,
  team text,
  rolle text,
  status text DEFAULT 'pending',
  code text,
  permission text DEFAULT 'create',
  blocked_features text[] DEFAULT '{}',
  is_blocked boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- MATERIALS
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sap text UNIQUE,
  shuttle text,
  tablar text,
  baureihen text[] DEFAULT '{}',
  gewerk text,
  eingetragen text,
  notiz text,
  created_at timestamptz DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- FEHLER-WISSENSDATENBANK
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fehler (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  fehlercode text,
  beschreibung text NOT NULL,
  loesung text,
  zugnummer text,
  baureihe text,
  kategorie text,
  schwere text DEFAULT 'mittel',
  materialien jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  erstellt_von text NOT NULL,
  hilfreich_count integer DEFAULT 0,
  aufrufe integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fehler_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fehler_id uuid REFERENCES fehler(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fehler_id, user_name)
);

CREATE TABLE IF NOT EXISTS fehler_kommentare (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fehler_id uuid REFERENCES fehler(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- NOTIZEN
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  type text NOT NULL,
  title text,
  content text,
  zugnummer text,
  baureihe text,
  frist_typ text,
  feuerloescher jsonb DEFAULT '[]',
  maengel jsonb DEFAULT '[]',
  material_abschreibung jsonb DEFAULT '[]',
  weiteres text,
  is_pinned boolean DEFAULT false,
  is_done boolean DEFAULT false,
  done_by text,
  done_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- FAHRZEUG-ZUSAMMENARBEIT
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fahrzeug_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zugnummer text NOT NULL,
  baureihe text,
  datum date DEFAULT CURRENT_DATE,
  team text,
  auftragsart text,
  erstellt_von text NOT NULL,
  status text DEFAULT 'aktiv',
  created_at timestamptz DEFAULT now(),
  UNIQUE(zugnummer, datum)
);

CREATE TABLE IF NOT EXISTS fahrzeug_eintraege (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES fahrzeug_sessions(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  bereich text NOT NULL,
  typ text DEFAULT 'mangel',
  beschreibung text NOT NULL,
  material_sap text,
  material_name text,
  schwere text,
  is_done boolean DEFAULT false,
  done_by text,
  done_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- GAME SCORES
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  score integer DEFAULT 0
);

-- ═════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS materials_name_idx ON materials USING gin(to_tsvector('german', name));
CREATE INDEX IF NOT EXISTS fehler_search_idx ON fehler USING gin(to_tsvector('german', coalesce(title,'') || ' ' || coalesce(beschreibung,'')));
CREATE INDEX IF NOT EXISTS notes_user_idx ON notes(user_name);
CREATE INDEX IF NOT EXISTS notes_type_idx ON notes(type);
CREATE INDEX IF NOT EXISTS fahrzeug_sessions_datum_idx ON fahrzeug_sessions(datum);
CREATE INDEX IF NOT EXISTS fahrzeug_eintraege_session_idx ON fahrzeug_eintraege(session_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE fehler ENABLE ROW LEVEL SECURITY;
ALTER TABLE fehler_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fehler_kommentare ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrzeug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrzeug_eintraege ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "open" ON users;
DROP POLICY IF EXISTS "open" ON materials;
DROP POLICY IF EXISTS "open" ON fehler;
DROP POLICY IF EXISTS "open" ON fehler_votes;
DROP POLICY IF EXISTS "open" ON fehler_kommentare;
DROP POLICY IF EXISTS "open" ON notes;
DROP POLICY IF EXISTS "open" ON fahrzeug_sessions;
DROP POLICY IF EXISTS "open" ON fahrzeug_eintraege;
DROP POLICY IF EXISTS "open" ON game_scores;

-- Create policies
CREATE POLICY "open" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON fehler FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON fehler_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON fehler_kommentare FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON fahrzeug_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON fahrzeug_eintraege FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON game_scores FOR ALL USING (true) WITH CHECK (true);

-- ═════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_hilfreich(fehler_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE fehler SET hilfreich_count = hilfreich_count + 1 WHERE id = fehler_id;
END;
$$ LANGUAGE plpgsql;
