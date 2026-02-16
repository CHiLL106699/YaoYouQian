"""
Fix all router files that create their own Supabase client.
Replace inline createClient with unified import from supabaseClient.
Also fix VITE_SUPABASE_URL references in appointmentRouter.
"""
import re
import os

# Files that create their own Supabase client
files_with_inline_client = [
    "server/routers/aftercareRouter.ts",
    "server/routers/couponRouter.ts",
    "server/routers/customerTagRouter.ts",
    "server/routers/errorLogRouter.ts",
    "server/routers/memberLevelRouter.ts",
    "server/routers/memberPromoRouter.ts",
    "server/routers/paymentMethodRouter.ts",
    "server/routers/referralRouter.ts",
    "server/routers/shopRouter.ts",
    "server/routers/weightTrackingRouter.ts",
    "server/routers/transferRouter.ts",
    "server/routers/timeSlotTemplateRouter.ts",
]

for filepath in files_with_inline_client:
    full_path = os.path.join("/home/ubuntu/YaoYouQian", filepath)
    if not os.path.exists(full_path):
        print(f"SKIP (not found): {filepath}")
        continue
    
    with open(full_path, 'r') as f:
        content = f.read()
    
    original = content
    
    # Remove the createClient import line
    content = re.sub(r'import\s*\{\s*createClient\s*\}\s*from\s*["\']@supabase/supabase-js["\'];\s*\n', '', content)
    
    # Remove the inline supabase client creation (multi-line pattern)
    # Pattern: const supabase = createClient(\n  process.env.VITE_SUPABASE_URL!,\n  process.env.SUPABASE_SERVICE_ROLE_KEY!\n);
    content = re.sub(
        r'const\s+supabase\s*=\s*createClient\(\s*\n\s*process\.env\.VITE_SUPABASE_URL!\s*,\s*\n\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\n\s*\);\s*\n',
        '',
        content
    )
    
    # Also handle single-line version
    content = re.sub(
        r'const\s+supabase\s*=\s*createClient\(\s*process\.env\.VITE_SUPABASE_URL!\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\);\s*\n',
        '',
        content
    )
    
    # Check if supabase is already imported from supabaseClient
    if 'from "../supabaseClient"' not in content and 'from \'../supabaseClient\'' not in content:
        # Add the unified import after the last import statement
        # Find the position to insert
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx >= 0:
            lines.insert(last_import_idx + 1, 'import { supabase } from "../supabaseClient";')
        else:
            lines.insert(0, 'import { supabase } from "../supabaseClient";')
        
        content = '\n'.join(lines)
    
    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"FIXED: {filepath}")
    else:
        print(f"NO CHANGE: {filepath}")

# Fix appointmentRouter.ts - replace VITE_SUPABASE_URL with SUPABASE_URL
apt_path = "/home/ubuntu/YaoYouQian/server/routers/appointmentRouter.ts"
if os.path.exists(apt_path):
    with open(apt_path, 'r') as f:
        content = f.read()
    
    original = content
    content = content.replace('process.env.VITE_SUPABASE_URL', 'process.env.SUPABASE_URL')
    
    if content != original:
        with open(apt_path, 'w') as f:
            f.write(content)
        print(f"FIXED: server/routers/appointmentRouter.ts (VITE_SUPABASE_URL -> SUPABASE_URL)")

print("\nDone!")
