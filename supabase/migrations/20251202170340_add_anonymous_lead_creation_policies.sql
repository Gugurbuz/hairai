/*
  # Add Anonymous Lead Creation Policies

  1. Changes
    - Add INSERT policy for leads table to allow anonymous users
    - Add INSERT policy for analysis_results table to allow anonymous users
    - Add INSERT policy for lead_images table to allow anonymous users
  
  2. Security
    - Anonymous users can only INSERT data (create new leads)
    - They cannot SELECT, UPDATE, or DELETE existing data
    - This allows the public form to submit leads without authentication
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anonymous users can create leads" ON leads;
DROP POLICY IF EXISTS "Anonymous users can create analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Anonymous users can create lead images" ON lead_images;

-- Allow anonymous users to insert leads
CREATE POLICY "Anonymous users can create leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to insert analysis results
CREATE POLICY "Anonymous users can create analysis results"
  ON analysis_results FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to insert lead images
CREATE POLICY "Anonymous users can create lead images"
  ON lead_images FOR INSERT
  TO anon
  WITH CHECK (true);
