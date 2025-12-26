# Supabase Setup Guide

Complete guide for connecting and setting up your Supabase database for Replily.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Replily (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely - you'll need it for direct database access)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"** and wait for provisioning (2-3 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need three values:

   - **Project URL**: Found under "Project URL"
     - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key** (similar to "Publishable Key" in other services): Found under "Project API keys" → "anon public"
     - This is safe to expose in client-side code
     - Used for client-side operations (respects Row Level Security)
   - **service_role key** (similar to "Secret Key" in other services): Found under "Project API keys" → "service_role"
     - ⚠️ **KEEP THIS SECRET** - Never expose this in client-side code
     - Used for server-side admin operations (bypasses Row Level Security)

3. Copy these values - you'll add them to your `.env.local` file

## Step 3: Configure Environment Variables

1. If you haven't already, copy the environment template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Save the file

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
6. You should see "Success. No rows returned" - this means the schema was created successfully

### Verify the Schema

1. Go to **Table Editor** in the Supabase dashboard
2. You should see these tables:
   - `organizations`
   - `users`
   - `voice_profiles`
   - `locations`
   - `reviews`
   - `responses`

## Step 5: Configure Authentication

### Enable Email Authentication

1. Go to **Authentication** → **Providers** in the Supabase dashboard
2. **Email** should be enabled by default
3. Configure email settings:
   - **Enable email confirmations**: Recommended for production
   - **Site URL**: Set to `http://localhost:3000` for development
   - **Redirect URLs**: Add your production URL when deploying

### Enable Google OAuth

1. In the Supabase dashboard, go to **Authentication** (left sidebar)
2. Click on **"Providers"** tab
3. Find **"Google"** in the list of providers
4. Toggle the **"Enable Google provider"** switch to ON (or click **"Enable"** button)
5. You'll see fields for **Client ID** and **Client Secret** - you'll fill these in after creating credentials in Google Cloud Console
6. Set up Google OAuth credentials in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - If prompted, configure the OAuth consent screen first:
     - Go to **APIs & Services** → **OAuth consent screen**
     - Choose **External** (unless you have a Google Workspace)
     - Fill in app name, user support email, and developer contact
     - Add scopes: `https://www.googleapis.com/auth/userinfo.email` and `https://www.googleapis.com/auth/userinfo.profile`
     - Save and continue through the steps
   - Back in **Credentials**, select **"Web application"** as the application type
   - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - Replace `YOUR_PROJECT_REF` with your Supabase project reference ID (found in your Supabase project URL or Settings → General)
   - Click **"Create"**
   - Copy the **Client ID** and **Client Secret** (you'll only see the secret once, so save it securely)
7. Back in Supabase, paste your Google OAuth credentials into the fields:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
8. Click **"Save"** (or the save button at the bottom of the Google provider settings)

> **Note**: For Supabase OAuth, you only need basic OAuth credentials. The **Google Business Profile API** will need to be enabled separately later when you configure the app's Google integration (see `docs/SETUP.md`). The OAuth credentials you create here can be reused for that purpose.

## Step 6: Verify Row Level Security (RLS)

The migration script (`001_initial_schema.sql`) already includes RLS policies, but you can verify they're set up correctly:

1. Go to **Table Editor** in the Supabase dashboard (left sidebar)
2. Click on any table (e.g., `organizations`, `users`, `reviews`)
3. Click on the **"Policies"** tab (or look for a shield icon)
4. You should see RLS policies listed for each table ensuring users can only access data from their organization
5. Verify that RLS is enabled:
   - Look for a toggle or indicator showing "RLS Enabled" or "Row Level Security: ON"
   - If you see "RLS Disabled", click to enable it (though the migration should have enabled it automatically)

### Test RLS (Optional)

1. Create a test user via **Authentication** → **Users** → **"Add user"** (or **"Invite"**)
2. Use the SQL Editor to query tables as that user - you should only see data for that user's organization

## Step 7: Generate TypeScript Types

After setting up your schema, generate TypeScript types for type safety. You don't need to install the Supabase CLI - we'll use `npx` which downloads it temporarily.

**⚠️ Authentication Required:** The Supabase CLI needs an access token to generate types. Choose one of the authentication methods below first.

### Get a Supabase Access Token

You need to authenticate before generating types. Choose one method:

**Method 1: Get Access Token from Dashboard (Recommended)**
1. Go to [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate new token"**
3. Give it a name (e.g., "Type Generation")
4. Copy the token (you'll only see it once)

**Method 2: Login via CLI**

```bash
npx supabase login
```

Follow the prompts to authenticate in your browser.

### Option 1: Use the Helper Script (Recommended)

Once you have an access token, use the helper script:

**Windows PowerShell:**

```powershell
$env:SUPABASE_ACCESS_TOKEN="your-token-here"; npm run supabase:types
```

**macOS/Linux:**

```bash
SUPABASE_ACCESS_TOKEN="your-token-here" npm run supabase:types
```

Or if you logged in via CLI (Method 2), just run:

```bash
npm run supabase:types
```

This script automatically:
- Extracts your project ID from `.env.local`
- Uses your access token for authentication
- Generates types using `npx` (no installation needed)
- Saves them to `lib/supabase/types.ts`

### Option 2: Manual Generation

If you prefer to run it manually, you'll need to set the access token first:

**Windows PowerShell:**

```powershell
$env:SUPABASE_ACCESS_TOKEN="your-token-here"
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types.ts
```

**macOS/Linux:**

```bash
SUPABASE_ACCESS_TOKEN="your-token-here" npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types.ts
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID:
- Found in your Supabase project URL: `https://YOUR_PROJECT_REF.supabase.co`
- Or in Settings → General → Reference ID

### Optional: Install Supabase CLI (Only if Needed for Other Features)

If you want the CLI installed for other features (like local development), you can install it via:

**Windows (using Scoop):**

```powershell
# First install Scoop (if not already installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex

# Then install Supabase CLI
scoop install supabase
```

**macOS/Linux:**

```bash
brew install supabase/tap/supabase
```

> **Note**: The CLI installation is optional - `npx` works fine for just generating types.

## Step 8: Test the Connection

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Try signing up at `http://localhost:3000/signup`
3. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created
4. Check **Table Editor** → **users** to see if a user record was created

## Troubleshooting

### "Missing Supabase environment variables" Error

- Verify `.env.local` exists and contains all three Supabase variables
- Restart your development server after adding environment variables
- Check that variable names match exactly (no typos)

### "Row Level Security policy violation" Error

- Verify RLS policies were created (check **Authentication** → **Policies**)
- Ensure the user is authenticated (`auth.uid()` should return a user ID)
- Check that the user has an associated `organization_id` in the `users` table

### Type Generation Fails

- Verify your project ID is correct
- If using `npx`, ensure you have a stable internet connection
- Try clearing the npx cache: `npx clear-npx-cache` or use the complete command: `npx supabase@latest gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/types.ts` (replace `YOUR_PROJECT_ID` with your project reference ID, or use `--project-ref YOUR_PROJECT_REF` instead of `--project-id`)
- Try using the project reference instead of project ID

### Google OAuth Not Working

- Verify the redirect URI in Google Cloud Console matches: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Check that Google OAuth is enabled in Supabase dashboard
- Ensure you've added the correct Client ID and Secret

### "Access blocked: has not completed the Google verification process" (Error 403: access_denied)

This error occurs when your Google OAuth consent screen is in **Testing** mode and the user trying to sign in is not added as a test user.

**Quick Fix (for Development):**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to the **Test users** section
5. Click **"Add Users"**
6. Enter the email address of the user trying to sign in (e.g., `your.email@gmail.com`)
7. Click **"Add"**
8. The user should now be able to sign in

**For Production:**

To allow any user to sign in, you'll need to:
1. Complete Google's OAuth verification process
2. Submit your app for verification in the OAuth consent screen
3. Once approved, change the publishing status from "Testing" to "In production"

> **Note**: The `business.manage` scope used by Replily requires verification. Google will review your app to ensure it meets their requirements for accessing sensitive business data.

## Next Steps

- Configure other environment variables (Google, Stripe, Anthropic) - see `docs/SETUP.md`
- Set up Google Business Profile API credentials
- Configure Stripe for payments
- Set up email templates in Resend (optional)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase TypeScript Types](https://supabase.com/docs/reference/javascript/typescript-support)

