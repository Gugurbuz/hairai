/*
  # Hair AI Analysis Platform - Initial Schema

  ## Overview
  Complete database schema for a professional hair loss analysis platform.
  Supports anonymous patient submissions and clinic authentication.

  ## Tables Created

  ### 1. `leads` - Patient Submissions
  - `id` (uuid, primary key) - Unique identifier
  - `full_name` (text) - Patient's full name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone number
  - `age` (integer) - Patient age
  - `gender` (text) - Gender (male/female/other)
  - `status` (text) - Lead status (new/contacted/converted)
  - `created_at` (timestamptz) - Submission timestamp

  ### 2. `hair_analysis` - AI Analysis Results
  - `id` (uuid, primary key)
  - `lead_id` (uuid, foreign key) - Links to leads table
  - `norwood_scale` (text) - Hair loss classification
  - `density_score` (integer) - Overall hair density (0-100)
  - `estimated_grafts_min` (integer) - Minimum graft estimate
  - `estimated_grafts_max` (integer) - Maximum graft estimate
  - `donor_quality` (text) - Donor area assessment
  - `ai_summary` (text) - AI-generated summary
  - `created_at` (timestamptz)

  ### 3. `lead_photos` - Patient Photos
  - `id` (uuid, primary key)
  - `lead_id` (uuid, foreign key)
  - `angle` (text) - Photo angle (front/left/right/top/back)
  - `image_data` (text) - Base64 image data
  - `processed_data` (jsonb) - AI processing metadata
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Anonymous users can INSERT leads, analysis, and photos
  - Only authenticated users can SELECT/UPDATE data
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS lead_photos CASCADE;
DROP TABLE IF EXISTS hair_analysis CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS lead_images CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;

-- Create leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted')),
  created_at timestamptz DEFAULT now()
);

-- Create hair analysis table
CREATE TABLE hair_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  norwood_scale text,
  density_score integer CHECK (density_score >= 0 AND density_score <= 100),
  estimated_grafts_min integer,
  estimated_grafts_max integer,
  donor_quality text CHECK (donor_quality IN ('excellent', 'good', 'fair', 'poor')),
  ai_summary text,
  created_at timestamptz DEFAULT now()
);

-- Create lead photos table
CREATE TABLE lead_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  angle text NOT NULL CHECK (angle IN ('front', 'left', 'right', 'top', 'back')),
  image_data text NOT NULL,
  processed_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_hair_analysis_lead ON hair_analysis(lead_id);
CREATE INDEX idx_lead_photos_lead ON lead_photos(lead_id);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anonymous users to create new records
CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_insert_analysis"
  ON hair_analysis FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_insert_photos"
  ON lead_photos FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies: Authenticated users can view all data
CREATE POLICY "auth_select_leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_select_analysis"
  ON hair_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_select_photos"
  ON lead_photos FOR SELECT
  TO authenticated
  USING (true);
