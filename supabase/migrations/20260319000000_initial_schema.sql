-- ============================================================
-- ForgedAds Initial Schema
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ENUMS
CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'business');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');
CREATE TYPE content_type AS ENUM ('image', 'video');
CREATE TYPE generation_status AS ENUM ('pending', 'generating', 'completed', 'failed');
CREATE TYPE credit_tx_type AS ENUM ('subscription_grant', 'topup_purchase', 'generation_spend', 'refund', 'admin_adjustment');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  subscription_status subscription_status NOT NULL DEFAULT 'active',
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  credits_used_this_period INTEGER NOT NULL DEFAULT 0 CHECK (credits_used_this_period >= 0),
  period_reset_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================
-- BRAND KITS
-- ============================================================
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT CHECK (primary_color ~* '^#[0-9a-f]{6}$'),
  secondary_color TEXT CHECK (secondary_color ~* '^#[0-9a-f]{6}$'),
  accent_color TEXT CHECK (accent_color ~* '^#[0-9a-f]{6}$'),
  background_color TEXT CHECK (background_color ~* '^#[0-9a-f]{6}$'),
  font_heading TEXT,
  font_body TEXT,
  brand_voice TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE UNIQUE INDEX idx_brand_kits_one_default
  ON public.brand_kits(user_id) WHERE is_default = true;

-- Brand kit limit enforcement
CREATE OR REPLACE FUNCTION check_brand_kit_limit()
RETURNS TRIGGER AS $$
DECLARE
  kit_count INTEGER;
  user_tier subscription_tier;
  max_kits INTEGER;
BEGIN
  SELECT subscription_tier INTO user_tier FROM public.profiles WHERE id = NEW.user_id;
  max_kits := CASE user_tier
    WHEN 'starter' THEN 1
    WHEN 'pro' THEN 5
    WHEN 'business' THEN 999
  END;
  SELECT COUNT(*) INTO kit_count FROM public.brand_kits WHERE user_id = NEW.user_id;
  IF kit_count >= max_kits THEN
    RAISE EXCEPTION 'Brand kit limit reached for % tier (max: %)', user_tier, max_kits;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_brand_kit_limit
  BEFORE INSERT ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION check_brand_kit_limit();

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content_type content_type NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1', '9:16', '16:9', '4:5')),
  prompt_template TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- GENERATIONS
-- ============================================================
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  content_type content_type NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  output_url TEXT,
  thumbnail_url TEXT,
  status generation_status NOT NULL DEFAULT 'pending',
  credits_cost INTEGER NOT NULL DEFAULT 1 CHECK (credits_cost > 0),
  generation_time_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CREDIT TRANSACTIONS
-- ============================================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type credit_tx_type NOT NULL,
  description TEXT,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Atomic credit deduction
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID, p_amount INTEGER, p_generation_id UUID, p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT credits_balance INTO v_current_balance
    FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  IF v_current_balance < p_amount THEN RETURN NULL; END IF;
  v_new_balance := v_current_balance - p_amount;
  UPDATE public.profiles
    SET credits_balance = v_new_balance, credits_used_this_period = credits_used_this_period + p_amount
    WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, generation_id, balance_after)
    VALUES (p_user_id, -p_amount, 'generation_spend', p_description, p_generation_id, v_new_balance);
  RETURN p_generation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credit refund
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID, p_amount INTEGER, p_generation_id UUID
) RETURNS VOID AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
    SET credits_balance = credits_balance + p_amount,
        credits_used_this_period = GREATEST(credits_used_this_period - p_amount, 0)
    WHERE id = p_user_id RETURNING credits_balance INTO v_new_balance;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, generation_id, balance_after)
    VALUES (p_user_id, p_amount, 'refund', 'Generation failed — auto refund', p_generation_id, v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant credits (idempotent via stripe_event_id)
CREATE OR REPLACE FUNCTION grant_credits(
  p_user_id UUID, p_amount INTEGER, p_type credit_tx_type, p_stripe_event_id TEXT, p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_transactions WHERE stripe_event_id = p_stripe_event_id) THEN
    RETURN -1;
  END IF;
  UPDATE public.profiles SET credits_balance = credits_balance + p_amount
    WHERE id = p_user_id RETURNING credits_balance INTO v_new_balance;
  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, stripe_event_id, balance_after)
    VALUES (p_user_id, p_amount, p_type, p_description, p_stripe_event_id, v_new_balance);
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID, p_window_seconds INTEGER DEFAULT 60, p_max_requests INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.generations
    WHERE user_id = p_user_id AND created_at > now() - (p_window_seconds || ' seconds')::INTERVAL;
  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM public.profiles WHERE id = auth.uid())
    AND credits_balance IS NOT DISTINCT FROM (SELECT credits_balance FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users read own brand kits" ON public.brand_kits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own brand kits" ON public.brand_kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own brand kits" ON public.brand_kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own brand kits" ON public.brand_kits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own generations" ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generations" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone reads active templates" ON public.templates FOR SELECT USING (is_active = true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_generations_user_created ON public.generations(user_id, created_at DESC);
CREATE INDEX idx_generations_pending ON public.generations(status, created_at) WHERE status IN ('pending', 'generating');
CREATE INDEX idx_credit_tx_user_created ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_tx_stripe_event ON public.credit_transactions(stripe_event_id) WHERE stripe_event_id IS NOT NULL;
CREATE INDEX idx_generations_rate_limit ON public.generations(user_id, created_at DESC);
CREATE INDEX idx_brand_kits_user_id ON public.brand_kits(user_id);
CREATE INDEX idx_templates_active_category ON public.templates(category, sort_order) WHERE is_active = true;
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
