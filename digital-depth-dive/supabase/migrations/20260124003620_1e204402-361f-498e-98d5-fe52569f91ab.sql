-- Create table for saved lead searches
CREATE TABLE public.lead_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'industry',
  location TEXT,
  leads_found INTEGER NOT NULL DEFAULT 0,
  leads_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters_applied JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lead searches" 
ON public.lead_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead searches" 
ON public.lead_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead searches" 
ON public.lead_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead searches" 
ON public.lead_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_searches_updated_at
BEFORE UPDATE ON public.lead_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();