
-- Email Sequences for Lead Nurturing
CREATE TABLE public.email_sequences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual emails in a sequence
CREATE TABLE public.sequence_emails (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads added to sequences (connects Lead Finder to Lead Nurturing)
CREATE TABLE public.sequence_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    lead_email TEXT NOT NULL,
    lead_name TEXT,
    lead_company TEXT,
    lead_source TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
    current_email_index INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled social media posts
CREATE TABLE public.scheduled_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram')),
    content TEXT NOT NULL,
    media_url TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    post_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saved ads from Ad Library
CREATE TABLE public.saved_ads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL,
    advertiser TEXT NOT NULL,
    ad_title TEXT NOT NULL,
    ad_copy TEXT NOT NULL,
    media_url TEXT,
    landing_page TEXT,
    source_url TEXT,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated ads from Ad Generator
CREATE TABLE public.generated_ads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    source_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    format TEXT,
    headline TEXT NOT NULL,
    primary_text TEXT NOT NULL,
    call_to_action TEXT,
    hook TEXT,
    target_persona TEXT,
    marketing_angle TEXT,
    image_prompt TEXT,
    brand_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_sequences
CREATE POLICY "Users can view their own sequences" ON public.email_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sequences" ON public.email_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sequences" ON public.email_sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sequences" ON public.email_sequences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sequence_emails (via sequence ownership)
CREATE POLICY "Users can view emails in their sequences" ON public.sequence_emails FOR SELECT USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can create emails in their sequences" ON public.sequence_emails FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can update emails in their sequences" ON public.sequence_emails FOR UPDATE USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete emails in their sequences" ON public.sequence_emails FOR DELETE USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));

-- RLS Policies for sequence_leads
CREATE POLICY "Users can view their sequence leads" ON public.sequence_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their sequence leads" ON public.sequence_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their sequence leads" ON public.sequence_leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their sequence leads" ON public.sequence_leads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view their own posts" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own posts" ON public.scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.scheduled_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for saved_ads
CREATE POLICY "Users can view their saved ads" ON public.saved_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save ads" ON public.saved_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their saved ads" ON public.saved_ads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_ads
CREATE POLICY "Users can view their generated ads" ON public.generated_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save generated ads" ON public.generated_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their generated ads" ON public.generated_ads FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sequence_emails_updated_at BEFORE UPDATE ON public.sequence_emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sequence_leads_updated_at BEFORE UPDATE ON public.sequence_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
