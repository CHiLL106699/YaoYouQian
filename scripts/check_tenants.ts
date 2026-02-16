import { config } from 'dotenv';
config({ override: true });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少環境變數 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
