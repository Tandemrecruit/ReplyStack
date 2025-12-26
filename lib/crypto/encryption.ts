/**
 * Token Encryption Module
 *
 * Provides AES-256-GCM encryption for sensitive tokens (e.g., Google refresh tokens)
 * stored in the database. Uses a 32-byte key from the TOKEN_ENCRYPTION_KEY env var.
 *
 * Encrypted format (new): base64(keyVersion || IV || ciphertext || authTag)
 * - Key version: 1 byte (0x01 for primary key, 0x00 for old/legacy key)
 * - IV: 12 bytes (96 bits) - recommended size for GCM
 * - Auth tag: 16 bytes (128 bits) - appended by GCM mode
 *
 * Legacy format (backward compatible): base64(IV || ciphertext || authTag)
 * - Tokens without version byte are treated as encrypted with old key (version 0x00)
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

/** Key version byte length */
const KEY_VERSION_LENGTH = 1;

/** Key version identifiers */
export const KEY_VERSION_PRIMARY = 0x01; // Current primary key (TOKEN_ENCRYPTION_KEY)
const KEY_VERSION_OLD = 0x00; // Old key (TOKEN_ENCRYPTION_KEY_OLD) or legacy tokens without version

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
 * Result of token decryption, including the plaintext and key version used.
 */
export interface DecryptionResult {
  /** The decrypted plaintext token */
  plaintext: string;
  /** The key version that was used: 0x01 for primary key, 0x00 for old/legacy key */
  keyVersion: number;
}

/**
 * Encrypts a plaintext token using AES-256-GCM.
 *
 * The output format is: base64(keyVersion || IV || ciphertext || authTag)
 * - Key version: 1 byte (0x01 for primary key)
 * - IV: 12 random bytes
 * - Auth tag: 16 bytes (appended automatically by GCM)
 *
 * @param plaintext - The token to encrypt
 * @returns Base64-encoded encrypted payload (key version + IV + ciphertext + auth tag)
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

  // Combine key version + IV + ciphertext + authTag
  const keyVersion = Buffer.from([KEY_VERSION_PRIMARY]);
  const combined = Buffer.concat([keyVersion, iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypts a token encrypted with `encryptToken()`.
 *
 * Supports key rotation: if decryption with the primary key fails and
 * TOKEN_ENCRYPTION_KEY_OLD is set, attempts decryption with the old key.
 *
 * @param encrypted - Base64-encoded encrypted payload (key version + IV + ciphertext + auth tag, or legacy format)
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
  const result = decryptTokenWithVersion(encrypted);
  return result.plaintext;
}

/**
 * Decrypts a token and returns both the plaintext and the key version used.
 *
 * This is useful for re-encryption scripts that need to know which key was used
 * to encrypt a token, so they can skip tokens already encrypted with the primary key.
 *
 * @param encrypted - Base64-encoded encrypted payload (key version + IV + ciphertext + auth tag, or legacy format)
 * @returns DecryptionResult with plaintext and key version (0x01 for primary, 0x00 for old/legacy)
 * @throws TokenDecryptionError if decryption fails (invalid data, wrong key, tampered)
 * @throws TokenEncryptionConfigError if encryption key is not configured
 *
 * @example
 * ```typescript
 * const result = decryptTokenWithVersion(encryptedTokenFromDb);
 * // Returns: { plaintext: "my-secret-refresh-token", keyVersion: 0x01 }
 * ```
 */
export function decryptTokenWithVersion(encrypted: string): DecryptionResult {
  const key = getEncryptionKey();

  // Try primary key first
  try {
    const result = decryptWithKey(encrypted, key, KEY_VERSION_PRIMARY);
    return result;
  } catch (error) {
    // If primary key fails, try fallback key for rotation support
    const fallbackKey = getFallbackKey();
    if (fallbackKey) {
      try {
        const result = decryptWithKey(encrypted, fallbackKey, KEY_VERSION_OLD);
        return result;
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
 * Validates that a string is properly base64-encoded.
 *
 * @param str - String to validate
 * @returns true if valid base64, false otherwise
 */
function isValidBase64(str: string): boolean {
  // Empty string is not valid base64
  if (str.length === 0) {
    return false;
  }

  // Base64 strings must have length that is a multiple of 4
  if (str.length % 4 !== 0) {
    return false;
  }

  // Padding (=) can only appear at the end, and must be 0, 1, or 2 = signs
  const paddingMatch = str.match(/=+$/);
  const paddingLength = paddingMatch ? paddingMatch[0].length : 0;
  if (paddingLength > 2) {
    return false;
  }

  // Check that padding only appears at the end (no = in the middle)
  if (paddingLength > 0 && str.indexOf("=") !== str.length - paddingLength) {
    return false;
  }

  // All characters must be valid base64 characters (A-Z, a-z, 0-9, +, /, =)
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(str);
}

/**
 * Internal helper to decrypt with a specific key.
 *
 * Handles both new format (with key version byte) and legacy format (without version byte).
 * Legacy tokens are assumed to be encrypted with the old key (version 0x00).
 *
 * @param encrypted - Base64-encoded encrypted payload
 * @param key - The encryption key to use
 * @param expectedVersion - The key version to assign if decryption succeeds (0x01 for primary, 0x00 for old)
 * @returns DecryptionResult with plaintext and key version
 * @throws TokenDecryptionError on any decryption failure
 */
function decryptWithKey(
  encrypted: string,
  key: Buffer,
  expectedVersion: number,
): DecryptionResult {
  // Validate base64 encoding before attempting decode
  if (!isValidBase64(encrypted)) {
    throw new TokenDecryptionError(
      "Invalid base64 encoding in encrypted token",
    );
  }

  const combined = Buffer.from(encrypted, "base64");

  // Minimum length for legacy format: IV (12) + auth tag (16) = 28
  // Minimum length for new format: key version (1) + IV (12) + auth tag (16) = 29
  const minLengthLegacy = IV_LENGTH + AUTH_TAG_LENGTH;
  const minLengthNew = KEY_VERSION_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;

  if (combined.length < minLengthLegacy) {
    throw new TokenDecryptionError(
      `Encrypted token too short (${combined.length} bytes, minimum ${minLengthLegacy})`,
    );
  }

  // Check if this is the new format (with key version byte)
  // We detect this by checking if the first byte is a valid key version (0x00 or 0x01)
  // and if the length suggests it has a version byte
  let hasVersionByte = false;
  let keyVersion = KEY_VERSION_OLD; // Default to old/legacy
  let iv: Buffer;
  let authTag: Buffer;
  let ciphertext: Buffer;

  if (
    combined.length >= minLengthNew &&
    (combined[0] === KEY_VERSION_PRIMARY || combined[0] === KEY_VERSION_OLD)
  ) {
    // New format: keyVersion || IV || ciphertext || authTag
    hasVersionByte = true;
    keyVersion = combined[0];
    iv = combined.subarray(KEY_VERSION_LENGTH, KEY_VERSION_LENGTH + IV_LENGTH);
    authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    ciphertext = combined.subarray(
      KEY_VERSION_LENGTH + IV_LENGTH,
      combined.length - AUTH_TAG_LENGTH,
    );
  } else {
    // Legacy format: IV || ciphertext || authTag (no version byte)
    iv = combined.subarray(0, IV_LENGTH);
    authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    ciphertext = combined.subarray(
      IV_LENGTH,
      combined.length - AUTH_TAG_LENGTH,
    );
    // Legacy tokens are assumed to be encrypted with old key
    keyVersion = KEY_VERSION_OLD;
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const plaintext = decrypted.toString("utf8");

    // Return the version we detected (or expected version if we successfully decrypted)
    // If we successfully decrypted, use the expected version (which indicates which key worked)
    return {
      plaintext,
      keyVersion: hasVersionByte ? keyVersion : expectedVersion,
    };
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
