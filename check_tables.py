import os
from supabase import create_client

url = "https://mrifutgtlquznfgbmild.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I"

supabase = create_client(url, key)

# TiDB tables that need to exist in Supabase
tidb_tables = [
    'appointments', 'approvals', 'booking_slot_limits', 'customers',
    'dose_calculations', 'order_items', 'orders', 'products',
    'reschedule_approvals', 'services', 'slot_limits', 'tenant_settings',
    'tenant_subscriptions', 'tenants', 'time_slot_templates', 'users'
]

# Supabase existing tables (from swagger)
supabase_tables = [
    'aftercare_contents', 'aftercare_records', 'appointments', 'approvals',
    'booking_slot_limits', 'coupon_usage', 'coupons', 'customer_photos',
    'customer_tags', 'customers', 'deposits', 'dose_calculations',
    'error_logs', 'marketing_campaigns', 'member_levels', 'member_promos',
    'member_promotions', 'order_items', 'orders', 'payment_methods',
    'products', 'referrals', 'reschedule_approvals', 'reschedule_requests',
    'revenue', 'services', 'shop_orders', 'slot_limits', 'tenant_line_configs',
    'tenant_settings', 'tenant_subscriptions', 'tenants', 'time_slot_templates',
    'time_slots', 'vouchers', 'weight_tracking', 'white_label_settings'
]

missing = [t for t in tidb_tables if t not in supabase_tables]
print("Missing TiDB tables in Supabase:", missing)

# Check if users table needs to be created
if 'users' in missing:
    print("\n'users' table needs to be created in Supabase")
    print("Schema from Drizzle:")
    print("  id: serial primary key")
    print("  openId: varchar(64) not null unique")
    print("  name: text")
    print("  email: varchar(320)")
    print("  loginMethod: varchar(64)")
    print("  role: text default 'user' (enum: user, admin)")
    print("  createdAt: timestamp default now()")
    print("  updatedAt: timestamp default now()")
    print("  lastSignedIn: timestamp default now()")
