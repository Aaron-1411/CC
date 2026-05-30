-- Create analyses table to store website analysis history
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  analyzed_url TEXT NOT NULL,
  screenshot_url TEXT,
  analysis_data JSONB NOT NULL,
  metadata JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token UUID DEFAULT gen_random_uuid(),
  pages_analyzed INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_share_token ON public.analyses(share_token) WHERE is_public = true;
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view their own analyses"
ON public.analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public analyses via share token
CREATE POLICY "Anyone can view public analyses"
ON public.analyses
FOR SELECT
USING (is_public = true);

-- Users can create their own analyses
CREATE POLICY "Users can create their own analyses"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update their own analyses"
ON public.analyses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete their own analyses"
ON public.analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();