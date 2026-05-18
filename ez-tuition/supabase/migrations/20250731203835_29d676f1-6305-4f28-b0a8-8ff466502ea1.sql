-- Create Enquiries table with proper structure
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  service_of_interest TEXT NOT NULL,
  subject_of_interest TEXT NOT NULL,
  additional_information TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a contact form)
CREATE POLICY "Anyone can insert enquiries" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view all enquiries (for admin access)
CREATE POLICY "Authenticated users can view enquiries" ON public.enquiries
  FOR SELECT TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_enquiries_updated_at
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();