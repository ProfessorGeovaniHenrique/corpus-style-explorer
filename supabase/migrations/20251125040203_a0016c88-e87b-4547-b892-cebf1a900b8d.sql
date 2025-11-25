-- Enable RLS on spacy_api_health table
ALTER TABLE spacy_api_health ENABLE ROW LEVEL SECURITY;

-- Create policy: Only authenticated users can read health checks
CREATE POLICY "Authenticated users can read spacy health checks"
ON spacy_api_health
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Only system can insert health checks
CREATE POLICY "Only system can insert spacy health checks"
ON spacy_api_health
FOR INSERT
TO service_role
WITH CHECK (true);