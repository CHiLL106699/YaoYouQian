-- ============================================
-- Migration: EMR & Appointment Reminder Tables
-- Run this in Supabase SQL Editor or via psql
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
