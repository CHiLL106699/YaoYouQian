-- CreateTable
CREATE TABLE "member_promos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "promo_code" TEXT NOT NULL,
    "discount_percentage" INTEGER NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_promos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_promos_promo_code_key" ON "member_promos"("promo_code");

-- AddForeignKey
ALTER TABLE "member_promos" ADD CONSTRAINT "member_promos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS Policies
ALTER TABLE "member_promos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own member_promos." ON "member_promos" FOR SELECT USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.tenant_id = member_promos.tenant_id));
CREATE POLICY "Tenants can insert their own member_promos." ON "member_promos" FOR INSERT WITH CHECK (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.tenant_id = member_promos.tenant_id));
CREATE POLICY "Tenants can update their own member_promos." ON "member_promos" FOR UPDATE USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.tenant_id = member_promos.tenant_id));
CREATE POLICY "Tenants can delete their own member_promos." ON "member_promos" FOR DELETE USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.tenant_id = member_promos.tenant_id));
