ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

INSERT INTO profiles (username, password, name, role) VALUES 
('team_admin', 'team123', 'StarShape Team', 'team'),
('client_swati', 'client123', 'Swati Aggarwal', 'client')
ON CONFLICT (username) DO NOTHING;
