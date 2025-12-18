import { randomBytes } from "node:crypto";

// Store original env
const originalEnv = { ...process.env };

// Generate a valid test key (32 bytes = 64 hex chars)
const TEST_KEY = randomBytes(32).toString("hex");
const TEST_KEY_ALT = randomBytes(32).toString("hex");

describe("lib/crypto/encryption", () => {
  beforeEach(() => {
    // Reset modules to pick up env changes
    vi.resetModules();
    // Reset env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("encryptToken", () => {
    it("encrypts a token and returns a base64 string", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken } = await import("@/lib/crypto/encryption");

      const plaintext = "my-secret-refresh-token";
      const encrypted = encryptToken(plaintext);

      // Should be base64 encoded
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // Should be different from plaintext
      expect(encrypted).not.toBe(plaintext);

      // Encrypted output should be longer than plaintext (IV + auth tag overhead)
      const decoded = Buffer.from(encrypted, "base64");
      expect(decoded.length).toBeGreaterThan(plaintext.length);
    });

    it("produces different ciphertext for same plaintext (random IV)", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken } = await import("@/lib/crypto/encryption");

      const plaintext = "same-token-value";
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);

      // Different IVs should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("throws TokenEncryptionConfigError when key is missing", async () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      const { encryptToken, TokenEncryptionConfigError } = await import(
        "@/lib/crypto/encryption"
      );

      expect(() => encryptToken("test")).toThrow(TokenEncryptionConfigError);
      expect(() => encryptToken("test")).toThrow(
        "TOKEN_ENCRYPTION_KEY environment variable is not set",
      );
    });

    it("throws TokenEncryptionConfigError when key is wrong length", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = "tooshort";
      const { encryptToken, TokenEncryptionConfigError } = await import(
        "@/lib/crypto/encryption"
      );

      expect(() => encryptToken("test")).toThrow(TokenEncryptionConfigError);
      expect(() => encryptToken("test")).toThrow(
        "must be exactly 64 hexadecimal characters",
      );
    });

    it("throws TokenEncryptionConfigError when key contains non-hex chars", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = "g".repeat(64); // 'g' is not a hex char
      const { encryptToken, TokenEncryptionConfigError } = await import(
        "@/lib/crypto/encryption"
      );

      expect(() => encryptToken("test")).toThrow(TokenEncryptionConfigError);
    });
  });

  describe("decryptToken", () => {
    it("decrypts a token encrypted with encryptToken", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/crypto/encryption"
      );

      const plaintext = "my-secret-refresh-token-12345";
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("correctly handles unicode characters", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/crypto/encryption"
      );

      const plaintext = "token-with-émojis-🔐-and-日本語";
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("correctly handles empty string", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/crypto/encryption"
      );

      const plaintext = "";
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("correctly handles very long tokens", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/crypto/encryption"
      );

      const plaintext = "a".repeat(10000);
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("throws TokenDecryptionError for invalid base64", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { decryptToken, TokenDecryptionError } = await import(
        "@/lib/crypto/encryption"
      );

      // Invalid base64 characters
      expect(() => decryptToken("not!valid@base64")).toThrow(
        TokenDecryptionError,
      );
    });

    it("throws TokenDecryptionError for truncated ciphertext", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { decryptToken, TokenDecryptionError } = await import(
        "@/lib/crypto/encryption"
      );

      // Too short to contain IV + auth tag
      const shortData = Buffer.alloc(20).toString("base64");
      expect(() => decryptToken(shortData)).toThrow(TokenDecryptionError);
      expect(() => decryptToken(shortData)).toThrow("too short");
    });

    it("throws TokenDecryptionError for tampered ciphertext", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken, decryptToken, TokenDecryptionError } = await import(
        "@/lib/crypto/encryption"
      );

      const encrypted = encryptToken("secret-token");

      // Tamper with the ciphertext
      const decoded = Buffer.from(encrypted, "base64");
      // Flip a bit in the middle (ciphertext portion)
      // Buffer is guaranteed to have at least 28 bytes (IV + auth tag), index 20 is safe
      const originalByte = decoded[20];
      if (originalByte === undefined) {
        throw new Error("Buffer too short for tampering test");
      }
      decoded[20] = originalByte ^ 0xff;
      const tampered = decoded.toString("base64");

      expect(() => decryptToken(tampered)).toThrow(TokenDecryptionError);
    });

    it("throws TokenDecryptionError for wrong key", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken } = await import("@/lib/crypto/encryption");

      const encrypted = encryptToken("secret-token");

      // Reset modules and use different key
      vi.resetModules();
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_ALT;
      const { decryptToken, TokenDecryptionError } = await import(
        "@/lib/crypto/encryption"
      );

      expect(() => decryptToken(encrypted)).toThrow(TokenDecryptionError);
    });
  });

  describe("key rotation support", () => {
    it("decrypts with fallback key when primary key fails", async () => {
      // First, encrypt with old key
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken } = await import("@/lib/crypto/encryption");
      const encrypted = encryptToken("my-token");

      // Reset and set up new primary key with old key as fallback
      vi.resetModules();
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_ALT;
      process.env.TOKEN_ENCRYPTION_KEY_OLD = TEST_KEY;
      const { decryptToken } = await import("@/lib/crypto/encryption");

      // Should successfully decrypt using fallback key
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe("my-token");
    });

    it("prefers primary key over fallback key", async () => {
      // Encrypt with new key
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_ALT;
      const { encryptToken } = await import("@/lib/crypto/encryption");
      const encrypted = encryptToken("my-token");

      // Reset and set up with both keys
      vi.resetModules();
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_ALT;
      process.env.TOKEN_ENCRYPTION_KEY_OLD = TEST_KEY;
      const { decryptToken } = await import("@/lib/crypto/encryption");

      // Should successfully decrypt using primary key
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe("my-token");
    });

    it("ignores invalid fallback key format and still fails if primary key is wrong", async () => {
      // First encrypt with TEST_KEY
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { encryptToken } = await import("@/lib/crypto/encryption");
      const encrypted = encryptToken("my-token");

      // Reset and try to decrypt with wrong primary and invalid fallback
      vi.resetModules();
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_ALT; // Wrong key
      process.env.TOKEN_ENCRYPTION_KEY_OLD = "invalid-key"; // Invalid fallback

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { decryptToken, TokenDecryptionError } = await import(
        "@/lib/crypto/encryption"
      );

      // Should fail because primary is wrong and fallback is invalid
      expect(() => decryptToken(encrypted)).toThrow(TokenDecryptionError);

      // Warning should be logged about invalid fallback
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("TOKEN_ENCRYPTION_KEY_OLD is set but invalid"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("isEncryptionConfigured", () => {
    it("returns true when key is properly configured", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
      const { isEncryptionConfigured } = await import(
        "@/lib/crypto/encryption"
      );

      expect(isEncryptionConfigured()).toBe(true);
    });

    it("returns false when key is missing", async () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      const { isEncryptionConfigured } = await import(
        "@/lib/crypto/encryption"
      );

      expect(isEncryptionConfigured()).toBe(false);
    });

    it("returns false when key is invalid", async () => {
      process.env.TOKEN_ENCRYPTION_KEY = "invalid";
      const { isEncryptionConfigured } = await import(
        "@/lib/crypto/encryption"
      );

      expect(isEncryptionConfigured()).toBe(false);
    });
  });
});
