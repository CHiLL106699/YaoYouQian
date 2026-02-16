// Use Supabase Management API to execute SQL
// Try different auth approaches

const SUPABASE_URL = 'https://mrifutgtlquznfgbmild.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I';

const TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS staff (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    line_user_id VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    base_salary DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS commission_rules (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    service_id BIGINT,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    commission_rate DECIMAL(5, 4) NOT NULL,
    condition_type VARCHAR(50) NOT NULL DEFAULT 'immediate' CHECK (condition_type IN ('immediate', 'deferred', 'milestone')),
    condition_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS staff_order_roles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, staff_id, role_type)
  )`,
  `CREATE TABLE IF NOT EXISTS commission_records (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    rate DECIMAL(5, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    deferred_conditions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS service_materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    service_id BIGINT NOT NULL,
    inventory_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    quantity_per_use DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(service_id, inventory_id)
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('consume', 'restock', 'adjust', 'return')),
    quantity INTEGER NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(100),
    operator_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    current_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'critical')),
    notified_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

const INDEXES_SQL = [
  "CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(tenant_id, role_type)",
  "CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_commission_rules_lookup ON commission_rules(tenant_id, service_id, role_type)",
  "CREATE INDEX IF NOT EXISTS idx_staff_order_roles_order ON staff_order_roles(order_id)",
  "CREATE INDEX IF NOT EXISTS idx_staff_order_roles_staff ON staff_order_roles(staff_id)",
  "CREATE INDEX IF NOT EXISTS idx_commission_records_tenant ON commission_records(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_commission_records_staff ON commission_records(staff_id)",
  "CREATE INDEX IF NOT EXISTS idx_commission_records_order ON commission_records(order_id)",
  "CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(tenant_id, status)",
  "CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(tenant_id, sku)",
  "CREATE INDEX IF NOT EXISTS idx_service_materials_service ON service_materials(service_id)",
  "CREATE INDEX IF NOT EXISTS idx_service_materials_inventory ON service_materials(inventory_id)",
  "CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inv ON inventory_transactions(inventory_id)",
  "CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant ON inventory_transactions(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_tenant ON low_stock_alerts(tenant_id)",
  "CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_unresolved ON low_stock_alerts(tenant_id) WHERE resolved_at IS NULL",
];

const RLS_SQL = [
  "ALTER TABLE staff ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE staff_order_roles ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE inventory ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE service_materials ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY",
];

const POLICY_SQL = [
  "staff", "commission_rules", "staff_order_roles", "commission_records",
  "inventory", "service_materials", "inventory_transactions", "low_stock_alerts"
].map(t => `DROP POLICY IF EXISTS service_role_all ON ${t}; CREATE POLICY service_role_all ON ${t} FOR ALL TO service_role USING (true) WITH CHECK (true)`);

async function execSql(sql) {
  // Use the Supabase project's SQL execution endpoint
  // This is available via the pg_graphql or the built-in SQL API
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_ddl`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  return { status: resp.status, text: await resp.text() };
}

async function main() {
  // First, try to create the exec_ddl helper function using pg
  // Since direct DB connection fails, we'll use a different approach:
  // Create the function via the Supabase client's schema cache refresh
  
  console.log('Step 1: Creating exec_ddl helper function...');
  
  // We need to use pg with the correct connection. Let's try one more time
  // with the connection string format that Supabase expects
  const pg = await import('pg');
  
  // Try connecting with different approaches
  const connectionAttempts = [
    // Session mode pooler
    {
      connectionString: 'postgres://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false },
    },
    // Transaction mode pooler  
    {
      connectionString: 'postgres://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false },
    },
  ];
  
  let client = null;
  for (const config of connectionAttempts) {
    try {
      const c = new pg.default.Client(config);
      await c.connect();
      console.log(`Connected with: ${config.connectionString.substring(0, 30)}...`);
      client = c;
      break;
    } catch (e) {
      console.log(`Failed: ${e.message.substring(0, 80)}`);
    }
  }
  
  if (!client) {
    console.log('\nDirect DB connection failed. Falling back to REST API approach...');
    console.log('Will create tables via Supabase REST API workaround.\n');
    
    // Workaround: Use the Supabase client to create a function via the auth.users trick
    // Actually, we can't. Let's just output the SQL and ask the user to run it.
    console.log('=== SQL TO RUN IN SUPABASE DASHBOARD ===');
    const allSql = [...TABLES_SQL, ...INDEXES_SQL, ...RLS_SQL, ...POLICY_SQL].join(';\n');
    console.log(allSql);
    console.log('\n=== END SQL ===');
    return;
  }
  
  // If we got here, we have a DB connection
  console.log('\nStep 2: Creating tables...');
  for (let i = 0; i < TABLES_SQL.length; i++) {
    await client.query(TABLES_SQL[i]);
    console.log(`  ✓ Table ${i + 1}/${TABLES_SQL.length} created`);
  }
  
  console.log('\nStep 3: Creating indexes...');
  for (const sql of INDEXES_SQL) {
    await client.query(sql);
  }
  console.log(`  ✓ ${INDEXES_SQL.length} indexes created`);
  
  console.log('\nStep 4: Enabling RLS...');
  for (const sql of RLS_SQL) {
    await client.query(sql);
  }
  console.log(`  ✓ RLS enabled on ${RLS_SQL.length} tables`);
  
  console.log('\nStep 5: Creating RLS policies...');
  for (const sql of POLICY_SQL) {
    await client.query(sql);
  }
  console.log(`  ✓ ${POLICY_SQL.length} policies created`);
  
  // Verify
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('staff','commission_rules','staff_order_roles','commission_records','inventory','service_materials','inventory_transactions','low_stock_alerts')
    ORDER BY table_name;
  `);
  console.log(`\nVerified ${result.rows.length} new tables:`);
  for (const row of result.rows) {
    console.log(`  ✓ ${row.table_name}`);
  }
  
  await client.end();
  console.log('\nMigration complete!');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
