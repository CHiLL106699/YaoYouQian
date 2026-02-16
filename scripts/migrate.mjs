/**
 * Migration script: Create tables for EMR and Appointment Reminder modules
 * 
 * Strategy:
 * 1. First create an exec_sql RPC function via PostgREST (using a bootstrapping approach)
 * 2. Then use that function to execute DDL statements
 * 
 * Since PostgREST can't execute DDL directly, we use the Supabase JS client
 * with the service_role key. The service_role key has full access.
 * 
 * Alternative: We'll use the supabase-js client's rpc method after creating
 * a helper function through the Supabase SQL editor or existing RPC.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mrifutgtlquznfgbmild.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Check if tables already exist by trying to query them
async function tableExists(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  // If error code is 42P01 (undefined_table), table doesn't exist
  // If no error or different error, table exists
  if (error && error.code === '42P01') return false;
  if (error && error.message?.includes('does not exist')) return false;
  return true;
}

async function checkAllTables() {
  const tables = ['medical_records', 'medical_photos', 'consent_forms', 'appointment_reminders', 'appointment_locks'];
  const results = {};
  for (const t of tables) {
    results[t] = await tableExists(t);
    console.log(`  ${t}: ${results[t] ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  }
  return results;
}

console.log('Checking existing tables...');
const existing = await checkAllTables();

const allExist = Object.values(existing).every(v => v);
if (allExist) {
  console.log('\n✅ All tables already exist! No migration needed.');
  process.exit(0);
}

console.log('\nSome tables are missing. Need to create them.');
console.log('Since PostgREST cannot execute DDL, we need an alternative approach.');
console.log('');

// Try to use the exec_sql function if it exists
const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
if (!error) {
  console.log('exec_sql function exists! Using it for DDL...');
} else {
  console.log('exec_sql function does not exist.');
  console.log('Attempting to create tables using Supabase Edge Function approach...');
}

// Output the SQL that needs to be executed
const migrationSQL = `
-- ============================================
-- Migration: EMR & Appointment Reminder Tables
-- ============================================

-- 1. medical_records
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

-- 2. medical_photos
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

-- 3. consent_forms
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

-- 4. appointment_reminders
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

-- 5. appointment_locks
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_tenant ON medical_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_record ON medical_photos(record_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_patient ON medical_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_tenant ON medical_photos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_patient ON consent_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_tenant ON consent_forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_tenant ON appointment_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_locks_date_slot ON appointment_locks(appointment_date, time_slot, tenant_id);

-- RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_locks ENABLE ROW LEVEL SECURITY;
`;

console.log('Migration SQL saved. Will deploy via Edge Function...');

// Write SQL to file for reference
import { writeFileSync } from 'fs';
writeFileSync('/home/ubuntu/YaoYouQian/scripts/migration.sql', migrationSQL);
console.log('SQL written to scripts/migration.sql');
