/**
 * Create new tables for EMR and Appointment Reminder modules
 * Uses Supabase JS client with service role key
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrifutgtlquznfgbmild.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrations = [
  {
    name: 'medical_records',
    sql: `
      CREATE TABLE IF NOT EXISTS medical_records (
        id BIGSERIAL PRIMARY KEY,
        patient_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        doctor_id BIGINT,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        diagnosis TEXT,
        treatment_plan TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
      CREATE INDEX IF NOT EXISTS idx_medical_records_tenant ON medical_records(tenant_id);
      ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'medical_photos',
    sql: `
      CREATE TABLE IF NOT EXISTS medical_photos (
        id BIGSERIAL PRIMARY KEY,
        record_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL,
        patient_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'progress')),
        photo_url TEXT NOT NULL,
        photo_category TEXT,
        taken_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_medical_photos_record ON medical_photos(record_id);
      CREATE INDEX IF NOT EXISTS idx_medical_photos_patient ON medical_photos(patient_id);
      CREATE INDEX IF NOT EXISTS idx_medical_photos_tenant ON medical_photos(tenant_id);
      ALTER TABLE medical_photos ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'consent_forms',
    sql: `
      CREATE TABLE IF NOT EXISTS consent_forms (
        id BIGSERIAL PRIMARY KEY,
        patient_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        form_type TEXT NOT NULL,
        signature_data TEXT,
        signed_at TIMESTAMPTZ,
        witness_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_consent_forms_patient ON consent_forms(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consent_forms_tenant ON consent_forms(tenant_id);
      ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'appointment_reminders',
    sql: `
      CREATE TABLE IF NOT EXISTS appointment_reminders (
        id BIGSERIAL PRIMARY KEY,
        appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h', 'custom')),
        channel TEXT NOT NULL CHECK (channel IN ('line', 'sms', 'email')),
        sent_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_reminders_tenant ON appointment_reminders(tenant_id);
      ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'appointment_locks',
    sql: `
      CREATE TABLE IF NOT EXISTS appointment_locks (
        id BIGSERIAL PRIMARY KEY,
        appointment_date DATE NOT NULL,
        time_slot TEXT NOT NULL,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        locked_by BIGINT,
        locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        UNIQUE(appointment_date, time_slot, tenant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_appointment_locks_date_slot ON appointment_locks(appointment_date, time_slot, tenant_id);
      ALTER TABLE appointment_locks ENABLE ROW LEVEL SECURITY;
    `
  }
];

async function run() {
  for (const migration of migrations) {
    console.log(`\nExecuting migration: ${migration.name}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql: migration.sql });
    if (error) {
      console.log(`  ⚠️ RPC exec_sql not available, trying alternative...`);
      // Try individual statements via direct REST
      const statements = migration.sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        console.log(`  Executing: ${stmt.substring(0, 60)}...`);
      }
      console.log(`  ❌ Cannot execute DDL via REST API. Need SQL editor or MCP.`);
    } else {
      console.log(`  ✅ ${migration.name} created successfully`);
    }
  }
}

run().catch(console.error);
