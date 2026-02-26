
-- Create government schemes table
CREATE TABLE public.government_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'savings', 'insurance', 'tax', 'business', 'agriculture', 'housing', 'education', 'women', 'senior_citizen', 'general'
  target_audience TEXT NOT NULL, -- 'individual', 'business', 'farmer', 'women', 'senior_citizen', 'student', 'all'
  ministry TEXT,
  eligibility_criteria JSONB,
  benefits TEXT,
  how_to_apply TEXT,
  documents_required TEXT[],
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  launch_year INTEGER,
  keywords TEXT[],
  income_limit NUMERIC,
  age_min INTEGER,
  age_max INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view schemes"
ON public.government_schemes
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_government_schemes_updated_at
BEFORE UPDATE ON public.government_schemes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
