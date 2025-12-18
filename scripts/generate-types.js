#!/usr/bin/env node

/**
 * Helper script to generate TypeScript types from Supabase schema.
 *
 * Usage:
 *   npm run supabase:types
 *
 * Or with explicit project ID:
 *   SUPABASE_PROJECT_ID=your-project-id npm run supabase:types
 */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const { join } = require("path");

const rootDir = join(__dirname, "..");

// Try to get project ID from environment variable or .env.local
function getProjectId() {
  // Check environment variable first
  if (process.env.SUPABASE_PROJECT_ID) {
    return process.env.SUPABASE_PROJECT_ID;
  }

  // Try to read from .env.local
  try {
    const envFile = join(rootDir, ".env.local");
    const envContent = readFileSync(envFile, "utf-8");
    const urlMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_URL=https?:\/\/([^.]+)\.supabase\.co/,
    );

    if (urlMatch?.[1]) {
      return urlMatch[1];
    }
  } catch {
    // .env.local might not exist, that's okay
  }

  return null;
}

const projectId = getProjectId();

if (!projectId) {
  console.error("❌ Could not find Supabase project ID.");
  console.error("\nPlease provide it in one of these ways:");
  console.error("  1. Set SUPABASE_PROJECT_ID environment variable:");
  console.error(
    "     SUPABASE_PROJECT_ID=your-project-id npm run supabase:types",
  );
  console.error("  2. Add NEXT_PUBLIC_SUPABASE_URL to .env.local:");
  console.error(
    "     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co",
  );
  console.error("\nYou can find your project ID in:");
  console.error("  - Your Supabase project URL");
  console.error("  - Supabase Dashboard → Settings → General → Reference ID");
  process.exit(1);
}

// Check for access token
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

const outputPath = join(rootDir, "lib", "supabase", "types.ts");

console.log(
  `📦 Generating TypeScript types from Supabase project: ${projectId}`,
);
console.log(`📝 Output: ${outputPath}`);

if (!accessToken) {
  console.warn(
    "\n⚠️  No access token found. The Supabase CLI requires authentication.",
  );
  console.warn("\nYou have two options:");
  console.warn("\nOption 1: Get an access token from Supabase Dashboard");
  console.warn("  1. Go to https://supabase.com/dashboard/account/tokens");
  console.warn("  2. Click 'Generate new token'");
  console.warn("  3. Copy the token and run:");
  console.warn(
    `     $env:SUPABASE_ACCESS_TOKEN="your-token"; npm run supabase:types`,
  );
  console.warn("\nOption 2: Login with Supabase CLI");
  console.warn("  1. Run: npx supabase login");
  console.warn("  2. Follow the prompts to authenticate");
  console.warn("  3. Then run: npm run supabase:types");
  console.warn(
    "\nOr set SUPABASE_ACCESS_TOKEN in your .env.local file (not recommended for production)",
  );
  console.error("\n❌ Please authenticate first.");
  process.exit(1);
}

try {
  const env = { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken };
  execSync(
    `npx supabase gen types typescript --project-id ${projectId} > "${outputPath}"`,
    { stdio: "inherit", cwd: rootDir, shell: true, env },
  );
  console.log("✅ Types generated successfully!");
} catch {
  console.error("❌ Failed to generate types.");
  console.error("\nMake sure you have:");
  console.error(
    "  1. Valid project ID (check your .env.local or SUPABASE_PROJECT_ID)",
  );
  console.error("  2. Valid access token (set SUPABASE_ACCESS_TOKEN)");
  console.error("  3. Internet connection (to fetch schema from Supabase)");
  console.error("  4. Node.js and npm installed");
  console.error(
    "\nThe script uses 'npx' which automatically downloads the Supabase CLI.",
  );
  console.error("\nTo get an access token:");
  console.error("  Visit: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}
