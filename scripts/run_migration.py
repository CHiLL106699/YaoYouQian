import psycopg2
import sys

# The user provided Direct URL
# postgresql://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
# Try multiple connection approaches

connection_configs = [
    {
        "name": "Pooler Session Mode (6543)",
        "host": "aws-1-ap-northeast-1.pooler.supabase.com",
        "port": 6543,
        "user": "postgres.mrifutgtlquznfgbmild",
        "password": "13c0e727-a308-4244-9eda-2fd0edaa06a2",
        "dbname": "postgres",
        "sslmode": "require"
    },
    {
        "name": "Pooler Transaction Mode (5432)",
        "host": "aws-1-ap-northeast-1.pooler.supabase.com",
        "port": 5432,
        "user": "postgres.mrifutgtlquznfgbmild",
        "password": "13c0e727-a308-4244-9eda-2fd0edaa06a2",
        "dbname": "postgres",
        "sslmode": "require"
    },
]

conn = None
for config in connection_configs:
    name = config.pop("name")
    try:
        print(f"Trying {name}...")
        conn = psycopg2.connect(**config)
        conn.autocommit = False
        print(f"  Connected via {name}!")
        break
    except Exception as e:
        print(f"  Failed: {e}")
        conn = None

if not conn:
    print("All connection attempts failed!")
    sys.exit(1)

try:
    cur = conn.cursor()
    
    with open("scripts/create_new_tables.sql", "r") as f:
        sql = f.read()
    
    cur.execute(sql)
    conn.commit()
    print("Migration executed successfully!")
    
    # Verify tables
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'dashboard_snapshots', 'report_exports', 'smart_tags', 
            'customer_smart_tags', 'campaign_templates', 'campaign_executions',
            'medical_compliance_keywords'
        )
        ORDER BY table_name;
    """)
    rows = cur.fetchall()
    print("Created tables:")
    for r in rows:
        print(f"  - {r[0]}")
    
    # Verify seed data
    cur.execute("SELECT count(*) FROM medical_compliance_keywords")
    count = cur.fetchone()[0]
    print(f"Compliance keywords seeded: {count}")
    
except Exception as e:
    conn.rollback()
    print(f"Migration failed: {e}")
    sys.exit(1)
finally:
    conn.close()
