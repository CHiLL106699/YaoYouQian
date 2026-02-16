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
  const { data, error } = await supabase
    .from('aftercare_contents')
    .select('id, treatment_name, category')
    .order('sort_order');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Aftercare contents count:', data?.length);
  console.log(JSON.stringify(data, null, 2));
}

main();
