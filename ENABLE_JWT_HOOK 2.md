# Enable Custom Access Token Hook

## Problem
The admin interface cannot display contractors because the JWT doesn't contain the `role` claim needed for RLS policies.

## Solution
We've created a `custom_access_token_hook` function that injects the user's role into the JWT. This function needs to be enabled in Supabase.

## Steps to Enable

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb
2. Navigate to **Authentication** > **Hooks**
3. Find **Custom Access Token** hook
4. Enable it and set the function to: `public.custom_access_token_hook`
5. Click **Save**

### Option 2: Supabase Management API

```bash
# Replace with your actual values
PROJECT_REF="xpntvajwrjuvsqsmizzb"
SERVICE_ROLE_KEY="your-service-role-key"

curl -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "HOOK_CUSTOM_ACCESS_TOKEN_ENABLED": true,
    "HOOK_CUSTOM_ACCESS_TOKEN_URI": "pg-functions://postgres/custom_access_token_hook"
  }'
```

### Option 3: Local Development with Supabase CLI

If running locally:
```bash
supabase secrets set HOOK_CUSTOM_ACCESS_TOKEN_URI=pg-functions://postgres/custom_access_token_hook
```

## Verification

After enabling the hook:

1. **Sign out** and **sign back in** to get a new JWT with the role claim
2. Check your JWT contains the role:
   ```javascript
   // In browser console
   const session = await supabase.auth.getSession()
   console.log(session.data.session.access_token)
   // Decode at jwt.io - should see "role": "admin" in payload
   ```
3. Refresh the `/admin/contractors` page - contractors should now appear

## What This Fixes

- ✅ Admin can view all contractors (including unverified ones)
- ✅ RLS policy "Admins can manage all contractors" now works
- ✅ JWT contains `role` claim for all RLS checks
- ✅ Managers also get proper access based on their role

## Technical Details

The hook function:
- Queries `profiles.role` for the authenticated user
- Injects `role` into the JWT claims
- Executes on every login/token refresh
- Required for admin RLS policies like `(auth.jwt() ->> 'role') = 'admin'`
