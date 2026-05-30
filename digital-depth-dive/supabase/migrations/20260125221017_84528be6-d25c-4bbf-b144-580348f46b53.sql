-- Create lead_lists table for custom groups/folders
CREATE TABLE public.lead_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_list_items to link leads to lists
CREATE TABLE public.lead_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lead_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lead_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_lists
CREATE POLICY "Users can view their own lists" ON public.lead_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lists" ON public.lead_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lists" ON public.lead_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lists" ON public.lead_lists FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for lead_list_items
CREATE POLICY "Users can view their own list items" ON public.lead_list_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own list items" ON public.lead_list_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own list items" ON public.lead_list_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own list items" ON public.lead_list_items FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lead_lists_updated_at
  BEFORE UPDATE ON public.lead_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();