-- Create weight_tracking table
CREATE TABLE public.weight_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    weight DECIMAL(5, 2) NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_weight_tracking_tenant_id ON public.weight_tracking(tenant_id);
CREATE INDEX idx_weight_tracking_user_id ON public.weight_tracking(user_id);
CREATE INDEX idx_weight_tracking_recorded_at ON public.weight_tracking(recorded_at);

-- Enable Row Level Security
ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weight tracking records." ON public.weight_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own weight tracking records." ON public.weight_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weight tracking records." ON public.weight_tracking FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weight tracking records." ON public.weight_tracking FOR DELETE USING (auth.uid() = user_id);
