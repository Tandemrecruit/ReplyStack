#!/usr/bin/env npx tsx

/**
 * Token Re-encryption Script
 *
 * Re-encrypts all google_refresh_tokens with a new encryption key.
 * Used during key rotation to migrate tokens from old key to new key.
 *
 * ## Prerequisites
 *
 * 1. Set environment variables:
 *    - TOKEN_ENCRYPTION_KEY = new key (will be used for encryption)
 *    - TOKEN_ENCRYPTION_KEY_OLD = old key (will be used for decryption fallback)
 *    - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *
 * 2. Ensure the new key is valid (64 hex characters)
 *
 * ## Usage
 *
 * ```bash
 * # Dry run (no changes made)
 * npx tsx scripts/reencrypt-tokens.ts --dry-run
 *
 * # Actually re-encrypt tokens (interactive confirmation required)
 * npx tsx scripts/reencrypt-tokens.ts
 *
 * # Non-interactive mode (for CI/automation, requires --force)
 * npx tsx scripts/reencrypt-tokens.ts --force
 * ```
 *
 * ## Key Rotation Procedure
 *
 * 1. Generate new key: -join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Maximum 256) })
 * 2. Set TOKEN_ENCRYPTION_KEY to new key
 * 3. Set TOKEN_ENCRYPTION_KEY_OLD to current/old key
 * 4. Deploy application (dual-key decryption now active)
 * 5. Run this script to re-encrypt all tokens
 * 6. Remove TOKEN_ENCRYPTION_KEY_OLD from environment
 *
 * @module scripts/reencrypt-tokens
 */

import * as readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import {
  decryptTokenWithVersion,
  encryptToken,
  isEncryptionConfigured,
  KEY_VERSION_PRIMARY,
  TokenDecryptionError,
} from "../lib/crypto/encryption";

interface UserWithToken {
  id: string;
  google_refresh_token: string | null;
}

interface ReencryptionStats {
  total: number;
  success: number;
  skipped: number;
  failed: number;
  wouldReencrypt: number;
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Re-encrypts all tokens in the database with the current encryption key.
 *
 * @param dryRun - If true, only simulates the operation without making changes
 * @returns Statistics about the re-encryption operation
 */
async function reencryptAllTokens(dryRun: boolean): Promise<ReencryptionStats> {
  const stats: ReencryptionStats = {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    wouldReencrypt: 0,
    errors: [],
  };

  // Validate environment
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!isEncryptionConfigured()) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not configured or invalid. Cannot proceed with re-encryption.",
    );
  }

  if (!process.env.TOKEN_ENCRYPTION_KEY_OLD) {
    console.warn(
      "⚠️  TOKEN_ENCRYPTION_KEY_OLD is not set. This script will only work if tokens are already encrypted with the current key.",
    );
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all users with tokens
  console.log("📥 Fetching users with refresh tokens...");
  const { data: users, error: fetchError } = await supabase
    .from("users")
    .select("id, google_refresh_token")
    .not("google_refresh_token", "is", null);

  if (fetchError) {
    throw new Error(`Failed to fetch users: ${fetchError.message}`);
  }

  const usersWithTokens = (users ?? []) as UserWithToken[];
  stats.total = usersWithTokens.length;

  console.log(`📊 Found ${stats.total} users with refresh tokens`);

  if (stats.total === 0) {
    console.log("✅ No tokens to re-encrypt");
    return stats;
  }

  // Process each user
  for (const user of usersWithTokens) {
    try {
      // Skip if token is null (shouldn't happen due to query filter, but TypeScript safety)
      if (!user.google_refresh_token) {
        stats.skipped++;
        continue;
      }

      // Decrypt with current key (or fallback to old key) and get key version
      const result = decryptTokenWithVersion(user.google_refresh_token);

      // Check if token is already encrypted with the primary key
      if (result.keyVersion === KEY_VERSION_PRIMARY) {
        console.log(
          `⏭️  User ${user.id}: Token unchanged (already using current key)`,
        );
        stats.skipped++;
        continue;
      }

      // Re-encrypt with current key (token was encrypted with old key)
      const reencrypted = encryptToken(result.plaintext);

      if (dryRun) {
        console.log(`🔍 User ${user.id}: Would re-encrypt token (dry run)`);
        stats.wouldReencrypt++;
        continue;
      }

      // Update the token in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ google_refresh_token: reencrypted })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log(`✅ User ${user.id}: Token re-encrypted successfully`);
      stats.success++;
    } catch (error) {
      const errorMessage =
        error instanceof TokenDecryptionError
          ? `Decryption failed: ${error.message}`
          : error instanceof Error
            ? error.message
            : "Unknown error";

      console.error(`❌ User ${user.id}: ${errorMessage}`);
      stats.failed++;
      stats.errors.push({ userId: user.id, error: errorMessage });
    }
  }

  return stats;
}

/**
 * Prompts the user for confirmation before proceeding with live mode.
 *
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
async function promptConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "⚠️  This will modify tokens in the database. Type YES to proceed: ",
      (answer) => {
        rl.close();
        resolve(answer.trim() === "YES");
      },
    );
  });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log("🔐 Token Re-encryption Script");
  console.log("=".repeat(50));

  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  LIVE MODE - Tokens will be re-encrypted\n");

    // Require explicit confirmation unless --force is provided
    if (!force) {
      const confirmed = await promptConfirmation();
      if (!confirmed) {
        console.log("\n❌ Confirmation cancelled. Exiting without changes.");
        process.exit(1);
      }
      console.log("");
    }
  }

  try {
    const stats = await reencryptAllTokens(dryRun);

    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 Re-encryption Summary:");
    console.log(`   Total users with tokens: ${stats.total}`);
    if (dryRun) {
      console.log(`   Would re-encrypt (dry run): ${stats.wouldReencrypt}`);
    } else {
      console.log(`   Successfully re-encrypted: ${stats.success}`);
    }
    console.log(`   Skipped (unchanged/null): ${stats.skipped}`);
    console.log(`   Failed: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors:");
      for (const { userId, error } of stats.errors) {
        console.log(`   - User ${userId}: ${error}`);
      }
    }

    if (dryRun) {
      console.log(
        "\n🔍 This was a dry run. Run without --dry-run to apply changes.",
      );
    }

    // Exit with error code if any failures
    if (stats.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      "\n💥 Fatal error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
