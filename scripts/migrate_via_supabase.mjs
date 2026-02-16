// Migration script using Supabase JS client with service role
// Creates tables by inserting data and using PostgREST
// Since we can't run raw DDL via supabase-js, we'll use the pg module with correct connection

import pg from 'pg';
const { Client } = pg;

// Wait for circuit breaker to reset, then try connection
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryConnect() {
  // Try multiple connection approaches
  const configs = [
    {
      name: 'Transaction pooler (5432)',
      connectionString: 'postgres://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Session pooler (6543)',
      connectionString: 'postgres://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const config of configs) {
    const { name, ...connConfig } = config;
    try {
      console.log(`Trying ${name}...`);
      const client = new Client(connConfig);
      await client.connect();
      console.log(`Connected via ${name}!`);
      return client;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
    }
  }
  return null;
}

async function main() {
  console.log('Waiting 30s for circuit breaker to reset...');
  await sleep(30000);
  
  const client = await tryConnect();
  if (!client) {
    console.error('All connection attempts failed!');
    process.exit(1);
  }

  try {
    const sql = (await import('fs')).readFileSync('scripts/create_new_tables.sql', 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully!');
    
    // Verify
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'dashboard_snapshots', 'report_exports', 'smart_tags', 
        'customer_smart_tags', 'campaign_templates', 'campaign_executions',
        'medical_compliance_keywords'
      )
      ORDER BY table_name;
    `);
    console.log('Created tables:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));
    
    const kw = await client.query('SELECT count(*) FROM medical_compliance_keywords');
    console.log(`Compliance keywords seeded: ${kw.rows[0].count}`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
