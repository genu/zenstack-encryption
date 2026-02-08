import type { FieldDef } from '@zenstackhq/orm/schema';

/**
 * Simple encryption configuration using built-in AES-256-GCM encryption
 */
export type SimpleEncryption = {
    /**
     * The encryption key. Pass a Uint8Array of exactly 32 bytes, or a string
     * which will be derived to a 32-byte key via SHA-256.
     */
    key: string | Uint8Array;

    /**
     * Previous keys for key rotation support.
     * When decrypting, all keys (key + previousKeys) are tried.
     * Each key can be a Uint8Array (32 bytes) or a string (derived via SHA-256).
     */
    previousKeys?: (string | Uint8Array)[];
};

/**
 * Custom encryption configuration for user-provided encryption handlers
 */
export type CustomEncryption = {
    /**
     * Custom encryption function
     * @param model The model name
     * @param field The field definition
     * @param plain The plaintext value to encrypt
     * @returns The encrypted value
     */
    encrypt: (model: string, field: FieldDef, plain: string) => Promise<string>;

    /**
     * Custom decryption function
     * @param model The model name
     * @param field The field definition
     * @param cipher The encrypted value to decrypt
     * @returns The decrypted value
     */
    decrypt: (model: string, field: FieldDef, cipher: string) => Promise<string>;
};

/**
 * Encryption configuration - either simple (built-in) or custom
 */
export type EncryptionConfig = SimpleEncryption | CustomEncryption;

/**
 * Type guard to check if encryption config is custom
 */
export function isCustomEncryption(config: EncryptionConfig): config is CustomEncryption {
    return 'encrypt' in config && 'decrypt' in config;
}
