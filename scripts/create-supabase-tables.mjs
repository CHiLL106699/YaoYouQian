import pg from 'pg';
const { Client } = pg;

async function main() {
  const dbUrl = `postgresql://postgres.mrifutgtlquznfgbmild:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
  
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');
    
    const sql = `
    CREATE TABLE IF NOT EXISTS tenant_subscriptions (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      plan VARCHAR(50) NOT NULL DEFAULT 'basic',
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      line_pay_subscription_id VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id),
      total_amount DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      shipping_address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name VARCHAR(255),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS time_slot_templates (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      max_bookings INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS dose_calculations (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id),
      product_name VARCHAR(255),
      dose_amount DECIMAL(10,2),
      unit VARCHAR(50),
      frequency VARCHAR(100),
      notes TEXT,
      calculated_by VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      reference_id INTEGER,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      requested_by VARCHAR(255),
      approved_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reschedule_approvals (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      appointment_id INTEGER REFERENCES appointments(id),
      original_date TIMESTAMPTZ,
      original_time VARCHAR(10),
      requested_date TIMESTAMPTZ,
      requested_time VARCHAR(10),
      reason TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      requested_by VARCHAR(255),
      approved_by VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS slot_limits (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      time_slot VARCHAR(10) NOT NULL,
      max_bookings INTEGER NOT NULL DEFAULT 1,
      current_bookings INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS booking_slot_limits (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      time_slot VARCHAR(10) NOT NULL,
      max_bookings INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS member_promotions (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      discount_type VARCHAR(50) DEFAULT 'percentage',
      discount_value DECIMAL(10,2) DEFAULT 0,
      min_level_id INTEGER REFERENCES member_levels(id),
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tenant_settings (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
      primary_color VARCHAR(20) DEFAULT '#d4af37',
      secondary_color VARCHAR(20) DEFAULT '#0a1929',
      logo_url TEXT,
      business_hours TEXT,
      notification_settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `;

    await client.query(sql);
    console.log('All tables created successfully!');

    // Fix tenants table - make owner_line_user_id nullable
    try {
      await client.query('ALTER TABLE tenants ALTER COLUMN owner_line_user_id DROP NOT NULL;');
      console.log('Fixed tenants.owner_line_user_id to nullable');
    } catch (e) {
      console.log('owner_line_user_id already nullable or error:', e.message);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
