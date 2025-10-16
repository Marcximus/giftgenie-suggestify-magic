-- Fix 1: Restrict search_analytics table access
-- Remove the overly permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "Allow anyone to insert search analytics" ON search_analytics;

-- Add authenticated-only insert policy
CREATE POLICY "Authenticated users can insert search analytics"
ON search_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep admin view policy as is
-- The "Allow admin to view search analytics" policy already exists and is appropriate