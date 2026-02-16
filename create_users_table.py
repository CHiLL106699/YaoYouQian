"""
Create the 'users' table in Supabase PostgreSQL.
"""
import requests

ACCESS_TOKEN = "sbp_616cebdde4338bdc12c08814cb8e50352eb90c34"

sql = """
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    "loginMethod" VARCHAR(64),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access" ON public.users
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;
"""

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://api.supabase.com/v1/projects/mrifutgtlquznfgbmild/database/query",
    headers=headers,
    json={"query": sql}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

# Verify
if response.status_code == 200 or response.status_code == 201:
    print("\n✅ 'users' table created successfully!")
else:
    print(f"\n❌ Failed to create 'users' table")
