-- Run this in the Supabase Dashboard SQL Editor
-- Project: CHI-neighborhoods (beusdypkfxbigsugieqn)

CREATE TABLE public.search_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.search_history TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE search_history_id_seq TO anon, authenticated;

CREATE POLICY "Select search_history" ON public.search_history
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Insert search_history" ON public.search_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Delete search_history" ON public.search_history
  FOR DELETE TO anon, authenticated USING (true);
