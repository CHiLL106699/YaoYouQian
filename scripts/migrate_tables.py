#!/usr/bin/env python3
"""Create HRM/Payroll and ERP tables via Supabase Management API."""
import requests
import json
import os

# Supabase Management API requires a personal access token
# But we can use the SQL endpoint directly
SUPABASE_URL = 'https://mrifutgtlquznfgbmild.supabase.co'
SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I'

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

# We'll create an RPC function first that can execute arbitrary SQL,
# then use it to create our tables

# Step 1: Create an exec_sql RPC function using the REST API
# Actually, we can use the pg_net or just create tables one by one via REST
# The simplest approach: use Supabase's built-in SQL execution via the /pg endpoint

# Let's try using the Supabase SQL API endpoint (undocumented but works)
def exec_sql_via_rpc(sql):
    """Execute SQL by creating a temporary RPC function."""
    # First, create the function
    create_fn = {
        "name": "_temp_exec_sql",
        "definition": f"""
        CREATE OR REPLACE FUNCTION _temp_exec_sql() RETURNS void AS $$
        BEGIN
            {sql}
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        """
    }
    
    # Actually, let's just use the supabase-py client with rpc
    from supabase import create_client
    
    client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    return client

def create_tables_via_rest():
    """Create tables by inserting into each one (the table must exist first)."""
    # We need DDL access. Let's try the Supabase Dashboard API
    pass

def main():
    from supabase import create_client
    
    client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    # Try using rpc to execute SQL
    # First check if there's an exec_sql function
    tables_sql = [
        # Staff table
        """
        CREATE TABLE IF NOT EXISTS staff (
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
        )
        """,
        # Commission rules
        """
        CREATE TABLE IF NOT EXISTS commission_rules (
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
        )
        """,
        # Staff order roles
        """
        CREATE TABLE IF NOT EXISTS staff_order_roles (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            order_id BIGINT NOT NULL,
            staff_id BIGINT NOT NULL,
            role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(order_id, staff_id, role_type)
        )
        """,
        # Commission records
        """
        CREATE TABLE IF NOT EXISTS commission_records (
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
        )
        """,
        # Inventory
        """
        CREATE TABLE IF NOT EXISTS inventory (
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
        )
        """,
        # Service materials (BOM)
        """
        CREATE TABLE IF NOT EXISTS service_materials (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            service_id BIGINT NOT NULL,
            inventory_id BIGINT NOT NULL,
            tenant_id BIGINT NOT NULL,
            quantity_per_use DECIMAL(10, 2) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(service_id, inventory_id)
        )
        """,
        # Inventory transactions
        """
        CREATE TABLE IF NOT EXISTS inventory_transactions (
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
        )
        """,
        # Low stock alerts
        """
        CREATE TABLE IF NOT EXISTS low_stock_alerts (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            inventory_id BIGINT NOT NULL,
            tenant_id BIGINT NOT NULL,
            current_stock INTEGER NOT NULL,
            threshold INTEGER NOT NULL,
            alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'critical')),
            notified_at TIMESTAMPTZ,
            resolved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
    ]
    
    # Execute each CREATE TABLE via rpc
    # We need to create a helper function first
    helper_sql = """
    CREATE OR REPLACE FUNCTION exec_ddl(sql_text TEXT) RETURNS void AS $$
    BEGIN
        EXECUTE sql_text;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """
    
    # Try calling the rpc
    try:
        result = client.rpc('exec_ddl', {'sql_text': 'SELECT 1'}).execute()
        print(f"exec_ddl exists: {result}")
    except Exception as e:
        print(f"exec_ddl doesn't exist yet, need to create it: {e}")
        # We can't create functions via REST API directly
        # Let's try a different approach - use the pg_graphql or direct SQL
    
    # Alternative: Use the Supabase Management API v1 SQL endpoint
    # POST https://api.supabase.com/v1/projects/{ref}/database/query
    # This requires a management API token
    
    # Final approach: Use the Supabase SQL Editor endpoint
    # This is available at the project's own URL
    sql_url = f"{SUPABASE_URL}/pg"
    
    for i, sql in enumerate(tables_sql):
        print(f"Creating table {i+1}/{len(tables_sql)}...")
        resp = requests.post(
            sql_url,
            headers={
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
            },
            json={"query": sql.strip()}
        )
        if resp.status_code in (200, 201):
            print(f"  ✓ Success")
        else:
            print(f"  ✗ Failed: {resp.status_code} - {resp.text[:200]}")

if __name__ == "__main__":
    main()
