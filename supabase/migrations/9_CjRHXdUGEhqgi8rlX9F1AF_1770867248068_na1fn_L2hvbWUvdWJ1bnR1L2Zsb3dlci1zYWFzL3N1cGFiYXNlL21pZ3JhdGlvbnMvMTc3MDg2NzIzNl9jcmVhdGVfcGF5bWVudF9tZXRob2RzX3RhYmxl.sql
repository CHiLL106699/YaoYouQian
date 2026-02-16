-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "account_last_four" TEXT,
    "expiration_month" INTEGER,
    "expiration_year" INTEGER,
    "billing_address" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_tenant_id_idx" ON "payment_methods"("tenant_id");
CREATE INDEX "payment_methods_type_provider_idx" ON "payment_methods"("type", "provider");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own payment methods." ON "payment_methods" FOR SELECT USING (EXISTS ( SELECT 1 FROM "tenants" WHERE "id" = "payment_methods".tenant_id AND "id" = auth.uid() ));
CREATE POLICY "Tenants can insert their own payment methods." ON "payment_methods" FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM "tenants" WHERE "id" = "payment_methods".tenant_id AND "id" = auth.uid() ));
CREATE POLICY "Tenants can update their own payment methods." ON "payment_methods" FOR UPDATE USING (EXISTS ( SELECT 1 FROM "tenants" WHERE "id" = "payment_methods".tenant_id AND "id" = auth.uid() ));
CREATE POLICY "Tenants can delete their own payment methods." ON "payment_methods" FOR DELETE USING (EXISTS ( SELECT 1 FROM "tenants" WHERE "id" = "payment_methods".tenant_id AND "id" = auth.uid() ));
