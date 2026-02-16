CREATE TABLE public.shop_orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_date timestamptz DEFAULT now() NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_shop_orders_tenant_id ON public.shop_orders(tenant_id);
CREATE INDEX idx_shop_orders_order_date ON public.shop_orders(order_date);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own shop_orders." ON public.shop_orders
    FOR SELECT USING (auth.uid() = ( SELECT id FROM public.tenants WHERE id = tenant_id ));

CREATE POLICY "Tenants can insert their own shop_orders." ON public.shop_orders
    FOR INSERT WITH CHECK (auth.uid() = ( SELECT id FROM public.tenants WHERE id = tenant_id ));

CREATE POLICY "Tenants can update their own shop_orders." ON public.shop_orders
    FOR UPDATE USING (auth.uid() = ( SELECT id FROM public.tenants WHERE id = tenant_id ));

CREATE POLICY "Tenants can delete their own shop_orders." ON public.shop_orders
    FOR DELETE USING (auth.uid() = ( SELECT id FROM public.tenants WHERE id = tenant_id ));
