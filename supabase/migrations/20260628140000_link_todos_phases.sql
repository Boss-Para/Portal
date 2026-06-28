-- Add phase_id to todos table
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE;

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_text TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (though previously disabled globally, keeping standard boilerplate)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
