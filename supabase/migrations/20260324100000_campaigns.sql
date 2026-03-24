-- ============================================================
-- ForgedAds — Campaign & Campaign Variants (batch generation)
-- ============================================================

-- ENUM: campaign status
CREATE TYPE campaign_status AS ENUM ('draft', 'queued', 'generating', 'completed', 'partial', 'failed');

-- ============================================================
-- CAMPAIGNS (groups multiple ad variants into a single batch)
-- ============================================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  total_variants INTEGER NOT NULL DEFAULT 0 CHECK (total_variants >= 0),
  completed_variants INTEGER NOT NULL DEFAULT 0 CHECK (completed_variants >= 0),
  failed_variants INTEGER NOT NULL DEFAULT 0 CHECK (failed_variants >= 0),
  total_credits_cost INTEGER NOT NULL DEFAULT 0 CHECK (total_credits_cost >= 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CAMPAIGN VARIANTS (individual ad within a campaign)
-- ============================================================
CREATE TABLE public.campaign_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  variant_index INTEGER NOT NULL,
  variable_overrides JSONB NOT NULL DEFAULT '{}',
  aspect_ratio TEXT NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1', '9:16', '16:9', '4:5')),
  prompt TEXT,
  status generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 1 CHECK (credits_cost > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER campaign_variants_updated_at
  BEFORE UPDATE ON public.campaign_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Unique variant index per campaign
CREATE UNIQUE INDEX idx_campaign_variants_campaign_index
  ON public.campaign_variants(campaign_id, variant_index);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_campaigns_user_created ON public.campaigns(user_id, created_at DESC);
CREATE INDEX idx_campaigns_status ON public.campaigns(status, created_at) WHERE status IN ('queued', 'generating');
CREATE INDEX idx_campaign_variants_campaign ON public.campaign_variants(campaign_id);
CREATE INDEX idx_campaign_variants_generation ON public.campaign_variants(generation_id) WHERE generation_id IS NOT NULL;
CREATE INDEX idx_campaign_variants_status ON public.campaign_variants(status) WHERE status IN ('pending', 'generating');

-- ============================================================
-- FUNCTIONS (campaign credit operations)
-- ============================================================

-- Deduct credits for an entire campaign batch (atomic)
CREATE OR REPLACE FUNCTION deduct_campaign_credits(
  p_user_id UUID, p_campaign_id UUID, p_total_cost INTEGER, p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT credits_balance INTO v_current_balance
    FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  IF v_current_balance < p_total_cost THEN RETURN FALSE; END IF;
  v_new_balance := v_current_balance - p_total_cost;
  UPDATE public.profiles
    SET credits_balance = v_new_balance, credits_used_this_period = credits_used_this_period + p_total_cost
    WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (p_user_id, -p_total_cost, 'generation_spend',
            COALESCE(p_description, 'Campaign batch: ' || p_campaign_id::TEXT), v_new_balance);
  UPDATE public.campaigns SET total_credits_cost = p_total_cost, status = 'queued' WHERE id = p_campaign_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update campaign progress when a variant completes or fails
CREATE OR REPLACE FUNCTION update_campaign_progress(
  p_campaign_id UUID
) RETURNS campaign_status AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_failed INTEGER;
  v_new_status campaign_status;
BEGIN
  SELECT total_variants INTO v_total FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  SELECT COUNT(*) INTO v_completed FROM public.campaign_variants
    WHERE campaign_id = p_campaign_id AND status = 'completed';
  SELECT COUNT(*) INTO v_failed FROM public.campaign_variants
    WHERE campaign_id = p_campaign_id AND status = 'failed';
  UPDATE public.campaigns
    SET completed_variants = v_completed, failed_variants = v_failed
    WHERE id = p_campaign_id;
  IF v_completed + v_failed >= v_total THEN
    IF v_failed = 0 THEN v_new_status := 'completed';
    ELSIF v_completed = 0 THEN v_new_status := 'failed';
    ELSE v_new_status := 'partial';
    END IF;
    UPDATE public.campaigns SET status = v_new_status WHERE id = p_campaign_id;
  END IF;
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;
