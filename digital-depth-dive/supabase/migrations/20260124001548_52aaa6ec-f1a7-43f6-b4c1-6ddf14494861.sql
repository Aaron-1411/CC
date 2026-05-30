-- Create table for rebuilder operations
CREATE TABLE public.rebuilder_operations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    original_title TEXT,
    generated_html TEXT NOT NULL,
    brand_colors JSONB,
    extracted_info JSONB,
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rebuilder_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own operations" 
ON public.rebuilder_operations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own operations" 
ON public.rebuilder_operations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations" 
ON public.rebuilder_operations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own operations" 
ON public.rebuilder_operations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rebuilder_operations_updated_at
BEFORE UPDATE ON public.rebuilder_operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();