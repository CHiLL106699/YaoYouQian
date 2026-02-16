import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mrifutgtlquznfgbmild.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I'
);

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
