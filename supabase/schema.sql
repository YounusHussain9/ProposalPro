-- ProposalPro Schema — run in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email              TEXT NOT NULL,
  full_name          TEXT,
  plan               TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  exports_used       INTEGER NOT NULL DEFAULT 0,
  exports_limit      INTEGER NOT NULL DEFAULT 3,
  stripe_customer_id TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT 'Untitled Proposal',
  content     JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own proposals" ON public.proposals;
CREATE POLICY "Users can manage own proposals" ON public.proposals FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount            INTEGER NOT NULL,
  plan              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
