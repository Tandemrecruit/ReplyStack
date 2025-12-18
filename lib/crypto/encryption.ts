/**
 * Token Encryption Module
 *
 * Provides AES-256-GCM encryption for sensitive tokens (e.g., Google refresh tokens)
 * stored in the database. Uses a 32-byte key from the TOKEN_ENCRYPTION_KEY env var.
 *
 * Encrypted format: base64(IV || ciphertext || authTag)
 * - IV: 12 bytes (96 bits) - recommended size for GCM
 * - Auth tag: 16 bytes (128 bits) - appended by GCM mode
 *
 * ## Key Rotation Strategy
 *
 * 1. **Preparation**: Set `TOKEN_ENCRYPTION_KEY` to new key, `TOKEN_ENCRYPTION_KEY_OLD` to current key
 * 2. **Deploy**: `decryptToken()` automatically tries primary key first, falls back to old key
 * 3. **Re-encryption**: Run `npx tsx scripts/reencrypt-tokens.ts` to migrate all tokens
 * 4. **Cleanup**: Remove `TOKEN_ENCRYPTION_KEY_OLD` from environment
 *
 * @module lib/crypto/encryption
 */

import {
  type CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/** AES-256-GCM algorithm identifier */
const ALGORITHM: CipherGCMTypes = "aes-256-gcm";

/** IV length in bytes (96 bits recommended for GCM) */
const IV_LENGTH = 12;

/** Auth tag length in bytes (128 bits) */
const AUTH_TAG_LENGTH = 16;

/** Expected key length in bytes (256 bits) */
const _KEY_LENGTH = 32;

/**
 * Custom error class for token decryption failures.
 *
 * Thrown when decryption fails due to:
 * - Invalid/corrupted ciphertext
 * - Tampered data (auth tag verification failure)
 * - Wrong encryption key
 * - Invalid base64 encoding
 */
export class TokenDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenDecryptionError";
  }
}

/**
 * Custom error class for encryption configuration errors.
 *
 * Thrown when:
 * - TOKEN_ENCRYPTION_KEY is missing
 * - Key is not the correct length (must be 64 hex chars / 32 bytes)
 */
export class TokenEncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenEncryptionConfigError";
  }
}

/**
 * Retrieves and validates the encryption key from environment variables.
 *
 * The key must be a 64-character hexadecimal string (32 bytes).
 * Generate with: `openssl rand -hex 32`
 *
 * @returns The 32-byte encryption key as a Buffer
 * @throws TokenEncryptionConfigError if key is missing or invalid length
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new TokenEncryptionConfigError(
      "TOKEN_ENCRYPTION_KEY environment variable is not set",
    );
  }

  // Validate hex format and length (64 hex chars = 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new TokenEncryptionConfigError(
      "TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)",
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Retrieves the fallback encryption key for key rotation.
 *
 * During key rotation, the old key is stored in TOKEN_ENCRYPTION_KEY_OLD
 * to allow decryption of tokens encrypted with the previous key.
 *
 * @returns The fallback key as a Buffer, or null if not set
 */
function getFallbackKey(): Buffer | null {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY_OLD;

  if (!keyHex) {
    return null;
  }

  // Validate hex format and length
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    // Invalid fallback key - log warning but don't throw
    console.warn(
      "TOKEN_ENCRYPTION_KEY_OLD is set but invalid (must be 64 hex chars)",
    );
    return null;
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a plaintext token using AES-256-GCM.
 *
 * The output format is: base64(IV || ciphertext || authTag)
 * - IV: 12 random bytes
 * - Auth tag: 16 bytes (appended automatically by GCM)
 *
 * @param plaintext - The token to encrypt
 * @returns Base64-encoded encrypted payload (IV + ciphertext + auth tag)
 * @throws TokenEncryptionConfigError if encryption key is not configured
 *
 * @example
 * ```typescript
 * const encrypted = encryptToken("my-secret-refresh-token");
 * // Returns: "base64-encoded-string..."
 * ```
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV + ciphertext + authTag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypts a token encrypted with `encryptToken()`.
 *
 * Supports key rotation: if decryption with the primary key fails and
 * TOKEN_ENCRYPTION_KEY_OLD is set, attempts decryption with the old key.
 *
 * @param encrypted - Base64-encoded encrypted payload (IV + ciphertext + auth tag)
 * @returns The decrypted plaintext token
 * @throws TokenDecryptionError if decryption fails (invalid data, wrong key, tampered)
 * @throws TokenEncryptionConfigError if encryption key is not configured
 *
 * @example
 * ```typescript
 * const token = decryptToken(encryptedTokenFromDb);
 * // Returns: "my-secret-refresh-token"
 * ```
 */
export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey();

  // Try primary key first
  try {
    return decryptWithKey(encrypted, key);
  } catch (error) {
    // If primary key fails, try fallback key for rotation support
    const fallbackKey = getFallbackKey();
    if (fallbackKey) {
      try {
        return decryptWithKey(encrypted, fallbackKey);
      } catch {
        // Both keys failed - throw the original error
      }
    }

    // Re-throw as TokenDecryptionError with appropriate message
    if (error instanceof TokenDecryptionError) {
      throw error;
    }

    throw new TokenDecryptionError(
      `Failed to decrypt token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Internal helper to decrypt with a specific key.
 *
 * @param encrypted - Base64-encoded encrypted payload
 * @param key - The encryption key to use
 * @returns The decrypted plaintext
 * @throws TokenDecryptionError on any decryption failure
 */
function decryptWithKey(encrypted: string, key: Buffer): string {
  let combined: Buffer;

  try {
    combined = Buffer.from(encrypted, "base64");
  } catch {
    throw new TokenDecryptionError(
      "Invalid base64 encoding in encrypted token",
    );
  }

  // Minimum length: IV (12) + auth tag (16) = 28 (ciphertext can be 0 bytes for empty string)
  const minLength = IV_LENGTH + AUTH_TAG_LENGTH;
  if (combined.length < minLength) {
    throw new TokenDecryptionError(
      `Encrypted token too short (${combined.length} bytes, minimum ${minLength})`,
    );
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  );

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // GCM auth tag verification failure or other crypto error
    throw new TokenDecryptionError(
      `Decryption failed: ${error instanceof Error ? error.message : "Authentication failed"}`,
    );
  }
}

/**
 * Checks if the encryption configuration is valid.
 *
 * Use this for startup validation or health checks.
 *
 * @returns true if TOKEN_ENCRYPTION_KEY is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
