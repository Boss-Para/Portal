CREATE TABLE project_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  total_budget numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0
);

-- Insert a default row for project details
INSERT INTO project_details (total_budget, amount_paid) VALUES (40000, 10000);

CREATE TABLE phases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text CHECK (status IN ('completed', 'in-progress', 'pending')) DEFAULT 'pending',
  progress integer DEFAULT 0,
  milestone_amount text NOT NULL,
  weeks text NOT NULL,
  order_index integer NOT NULL
);

-- Insert default phases
INSERT INTO phases (name, status, progress, milestone_amount, weeks, order_index) VALUES 
('Discovery & Design', 'completed', 100, '₹10,000', 'Week 1-2', 1),
('Core Development', 'in-progress', 65, '₹15,000', 'Week 3-5', 2),
('Refinement & Testing', 'pending', 0, '₹10,000', 'Week 6-7', 3),
('Launch & Handover', 'pending', 0, '₹5,000', 'Week 8', 4);

CREATE TABLE scope_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  order_index integer NOT NULL
);

-- Insert default scope items
INSERT INTO scope_items (text, order_index) VALUES 
('User Authentication & Roles', 1),
('Real-time Chat & Comments', 2),
('Ticket Management System', 3),
('Meeting Scheduler Integration', 4),
('Access Request Approvals', 5),
('Responsive UI/UX Design', 6);

CREATE TABLE todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  done boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Disable RLS explicitly
ALTER TABLE project_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE project_details;
ALTER PUBLICATION supabase_realtime ADD TABLE phases;
ALTER PUBLICATION supabase_realtime ADD TABLE scope_items;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
