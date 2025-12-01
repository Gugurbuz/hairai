-- Hair AI Platform - Complete Database Schema
-- 
-- Overview: Complete database for hair transplant analysis platform
-- User types: patients (anonymous leads), clinics/doctors, admins

-- 1. CLINICS TABLE
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  country text,
  phone text,
  website text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended')),
  credit_balance integer DEFAULT 0,
  total_leads_purchased integer DEFAULT 0,
  profile_image_url text,
  description text,
  specializations text[] DEFAULT '{}',
  verification_documents jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  age integer,
  country text,
  budget_range text CHECK (budget_range IN ('low', 'medium', 'high', 'premium')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'locked', 'contacted', 'converted', 'refunded')),
  temperature_score integer DEFAULT 50,
  locked_by_clinic_id uuid REFERENCES clinics(id),
  locked_at timestamptz,
  refund_requested boolean DEFAULT false,
  refund_reason text,
  ad_source text,
  utm_params jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. ANALYSIS RESULTS TABLE
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  norwood_scale text,
  hair_density jsonb DEFAULT '{}',
  donor_area_score integer,
  estimated_grafts_min integer,
  estimated_grafts_max integer,
  recommended_technique text,
  hair_characteristics jsonb DEFAULT '{}',
  ai_summary text,
  ai_model_version text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- 4. LEAD IMAGES TABLE
CREATE TABLE IF NOT EXISTS lead_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  angle text NOT NULL CHECK (angle IN ('front', 'left', 'right', 'top', 'back')),
  image_url text NOT NULL,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit_purchase', 'lead_unlock', 'refund')),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  lead_id uuid REFERENCES leads(id),
  stripe_payment_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 6. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'support' CHECK (role IN ('super_admin', 'support', 'finance')),
  permissions text[] DEFAULT '{}',
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL CHECK (actor_type IN ('clinic', 'admin', 'system')),
  actor_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 8. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_locked_by ON leads(locked_by_clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_images_lead_id ON lead_images(lead_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_lead_id ON analysis_results(lead_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR CLINICS
CREATE POLICY "Clinics can view own data"
  ON clinics FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE POLICY "Clinics can update own data"
  ON clinics FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.current_clinic_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.current_clinic_id', true))::uuid);

-- RLS POLICIES FOR LEADS
CREATE POLICY "Clinics can view unlocked leads pool"
  ON leads FOR SELECT
  TO authenticated
  USING (status = 'new' OR locked_by_clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE POLICY "Clinics can update locked leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (locked_by_clinic_id = (current_setting('app.current_clinic_id', true))::uuid)
  WITH CHECK (locked_by_clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

-- RLS POLICIES FOR ANALYSIS RESULTS
CREATE POLICY "Clinics can view analysis for accessible leads"
  ON analysis_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = analysis_results.lead_id
      AND (leads.status = 'new' OR leads.locked_by_clinic_id = (current_setting('app.current_clinic_id', true))::uuid)
    )
  );

-- RLS POLICIES FOR LEAD IMAGES
CREATE POLICY "Clinics can view images for accessible leads"
  ON lead_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_images.lead_id
      AND (leads.status = 'new' OR leads.locked_by_clinic_id = (current_setting('app.current_clinic_id', true))::uuid)
    )
  );

-- RLS POLICIES FOR TRANSACTIONS
CREATE POLICY "Clinics can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

-- RLS POLICIES FOR ACTIVITY LOGS
CREATE POLICY "Clinics can view own activity"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (actor_type = 'clinic' AND actor_id = (current_setting('app.current_clinic_id', true))::uuid);

-- INSERT DEFAULT SYSTEM SETTINGS
INSERT INTO system_settings (key, value, description) VALUES
  ('lead_unlock_cost', '{"credits": 50}', 'Cost in credits to unlock one lead'),
  ('credit_prices', '{"100": 99, "500": 449, "1000": 799}', 'Credit packages and prices in USD'),
  ('refund_window_hours', '{"hours": 72}', 'Time window for lead refund requests'),
  ('min_temperature_score', '{"score": 30}', 'Minimum lead quality score to show in pool')
ON CONFLICT (key) DO NOTHING;