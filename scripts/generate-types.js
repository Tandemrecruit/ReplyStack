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

const { spawnSync } = require("node:child_process");
const { readFileSync, createWriteStream } = require("node:fs");
const { join } = require("node:path");

const rootDir = join(__dirname, "..");

// Try to get project ID from environment variable or .env.local
function getProjectId() {
  // Validate project ID format: 20-character alphanumeric string
  const projectIdPattern = /^[a-z0-9]{20}$/i;

  // Check environment variable first
  if (process.env.SUPABASE_PROJECT_ID) {
    const envProjectId = process.env.SUPABASE_PROJECT_ID;
    if (projectIdPattern.test(envProjectId)) {
      return envProjectId;
    }
    // Invalid format, continue to try .env.local
  }

  // Try to read from .env.local
  try {
    const envFile = join(rootDir, ".env.local");
    const envContent = readFileSync(envFile, "utf-8");
    const urlMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_URL=https?:\/\/([^.]+)\.supabase\.co/,
    );

    if (urlMatch?.[1]) {
      const extractedId = urlMatch[1];
      if (projectIdPattern.test(extractedId)) {
        return extractedId;
      }
      // Invalid format, treat as not found
    }
  } catch (err) {
    // Only ignore file-not-found errors
    if (err.code !== "ENOENT") {
      console.warn(`Warning: Could not read .env.local: ${err.message}`);
    }
  }

  return null;
}

// Try to get access token from environment variable or .env.local
function getAccessToken() {
  // Check environment variable first
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  // Try to read from .env.local
  try {
    const envFile = join(rootDir, ".env.local");
    const envContent = readFileSync(envFile, "utf-8");
    // Match SUPABASE_ACCESS_TOKEN=value, handling quoted and unquoted values
    // Also handle cases where value might be on the same line or next line
    const tokenMatch = envContent.match(/^SUPABASE_ACCESS_TOKEN\s*=\s*(.+)$/m);

    if (tokenMatch?.[1]) {
      // Remove quotes (single or double) if present and trim whitespace
      let token = tokenMatch[1].trim();
      // Remove surrounding quotes
      if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        token = token.slice(1, -1);
      }
      return token.trim();
    }
  } catch (err) {
    // Only ignore file-not-found errors
    if (err.code !== "ENOENT") {
      console.warn(`Warning: Could not read .env.local: ${err.message}`);
    }
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
const accessToken = getAccessToken();

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
  console.warn("     macOS/Linux (POSIX):");
  console.warn(
    `       SUPABASE_ACCESS_TOKEN="your-token" npm run supabase:types`,
  );
  console.warn("     Windows (PowerShell):");
  console.warn(
    `       $env:SUPABASE_ACCESS_TOKEN="your-token"; npm run supabase:types`,
  );
  console.warn("     Cross-platform (using cross-env):");
  console.warn(
    `       npx cross-env SUPABASE_ACCESS_TOKEN="your-token" npm run supabase:types`,
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

(async () => {
  try {
    const env = { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken };

    // Use spawnSync with proper escaping to avoid shell injection
    // On Windows, shell: true is needed to find npx, but we pass a single command string
    // with properly escaped arguments to avoid the deprecation warning
    // projectId is already validated (20-char alphanumeric), so it's safe to use directly
    const isWindows = process.platform === "win32";
    let command, args, shellOption;

    if (isWindows) {
      // On Windows, use shell: true with single command string to avoid deprecation warning
      // projectId is validated alphanumeric, so safe to interpolate
      command = `npx supabase gen types typescript --project-id ${projectId}`;
      args = [];
      shellOption = true;
    } else {
      // On Unix-like systems, use array format without shell for better security
      command = "npx";
      args = [
        "supabase",
        "gen",
        "types",
        "typescript",
        "--project-id",
        projectId,
      ];
      shellOption = false;
    }

    const result = spawnSync(command, args, {
      cwd: rootDir,
      env,
      shell: shellOption,
      stdio: ["inherit", "pipe", "inherit"], // stdin: inherit, stdout: pipe, stderr: inherit
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }

    // Write stdout to file using createWriteStream to avoid shell redirection
    const outputStream = createWriteStream(outputPath);
    outputStream.write(result.stdout);
    outputStream.end();

    // Wait for the stream to finish writing
    await new Promise((resolve, reject) => {
      outputStream.on("finish", resolve);
      outputStream.on("error", reject);
    });

    console.log("✅ Types generated successfully!");
  } catch (error) {
    console.error("❌ Failed to generate types.");
    if (error.message) {
      console.error(`\nError: ${error.message}`);
    }
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
})();
