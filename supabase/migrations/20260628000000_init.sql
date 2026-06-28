-- 0. Disable RLS and drop old tables if they exist to start fresh
DROP TABLE IF EXISTS ticket_replies CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Create Tables
CREATE TABLE profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  role text CHECK (role IN ('team', 'client')) NOT NULL,
  avatar text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE tickets (
  id text PRIMARY KEY,
  title text NOT NULL,
  phase integer NOT NULL,
  priority text CHECK (priority IN ('high', 'medium', 'low')) NOT NULL,
  status text CHECK (status IN ('open', 'pending-client', 'closed')) DEFAULT 'open',
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignee_role text CHECK (assignee_role IN ('team', 'client')) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE ticket_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id text REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  link text,
  notes text,
  confirmed boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE access_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item text NOT NULL,
  reason text,
  status text CHECK (status IN ('pending', 'granted', 'denied')) DEFAULT 'pending',
  requested_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  due_date date NOT NULL,
  for_roles text[] NOT NULL,
  done boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Insert Default Users so you can log in immediately
INSERT INTO profiles (username, password, name, role) VALUES 
('team_admin', 'team123', 'StarShape Team', 'team'),
('client_swati', 'client123', 'Swati Aggarwal', 'client');

-- 3. Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE access_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
