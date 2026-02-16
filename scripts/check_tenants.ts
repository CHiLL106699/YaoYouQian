import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://mrifutgtlquznfgbmild.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I'
);
async function main() {
  const { data: tenants } = await supabase.from('tenants').select('id, name').limit(10);
  console.log('Tenants:', JSON.stringify(tenants, null, 2));
  
  const { data: aftercare } = await supabase.from('aftercare_contents').select('id, tenant_id, treatment_name, category').limit(10);
  console.log('Aftercare contents:', JSON.stringify(aftercare, null, 2));
  
  const { data: services } = await supabase.from('services').select('id, tenant_id, name, duration_minutes').limit(10);
  console.log('Services:', JSON.stringify(services, null, 2));

  const { data: vouchers } = await supabase.from('vouchers').select('id, tenant_id, voucher_code').limit(5);
  console.log('Vouchers:', JSON.stringify(vouchers, null, 2));

  const { data: campaigns } = await supabase.from('marketing_campaigns').select('id, tenant_id, campaign_name').limit(5);
  console.log('Marketing campaigns:', JSON.stringify(campaigns, null, 2));
}
main();
