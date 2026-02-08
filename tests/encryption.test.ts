import { describe, expect, it, vi } from 'vitest';
import { Decrypter } from '../src/decrypter.js';
import { Encrypter } from '../src/encrypter.js';
import type { FieldDef } from '@zenstackhq/orm/schema';
import type { CustomEncryption } from '../src/types.js';
import { isCustomEncryption } from '../src/types.js';
import { deriveKey, ENCRYPTION_KEY_BYTES } from '../src/utils.js';

// Generate test keys
function randomKey(): Uint8Array {
    const key = new Uint8Array(ENCRYPTION_KEY_BYTES);
    crypto.getRandomValues(key);
    return key;
}

describe('Encrypter', () => {
    it('encrypts data to a non-plaintext format', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);

        const encrypted = await encrypter.encrypt('hello world');
        expect(encrypted).not.toBe('hello world');
        expect(encrypted).toContain('.'); // metadata.ciphertext format
    });

    it('produces different ciphertexts for same plaintext (random IV)', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);

        const a = await encrypter.encrypt('same input');
        const b = await encrypter.encrypt('same input');
        expect(a).not.toBe(b);
    });

    it('rejects invalid key length', () => {
        expect(() => new Encrypter(new Uint8Array(16))).toThrow('Encryption key must be 32 bytes');
    });
});

describe('Decrypter', () => {
    it('decrypts data encrypted by Encrypter', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('secret message');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('secret message');
    });

    it('handles empty string content', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('');
    });

    it('handles unicode content', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('hello 🌍 world');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('hello 🌍 world');
    });

    it('rejects invalid key length', () => {
        expect(() => new Decrypter([new Uint8Array(16)])).toThrow('Decryption key must be 32 bytes');
    });

    it('rejects empty keys array', () => {
        expect(() => new Decrypter([])).toThrow('At least one decryption key must be provided');
    });

    it('throws on malformed data', async () => {
        const key = randomKey();
        const decrypter = new Decrypter([key]);

        await expect(decrypter.decrypt('not-encrypted')).rejects.toThrow('Malformed encrypted data');
    });

    it('throws on wrong key', async () => {
        const key1 = randomKey();
        const key2 = randomKey();
        const encrypter = new Encrypter(key1);
        const decrypter = new Decrypter([key2]);

        const encrypted = await encrypter.encrypt('secret');
        await expect(decrypter.decrypt(encrypted)).rejects.toThrow();
    });
});

describe('Key rotation', () => {
    it('decrypts with old key when new key is primary', async () => {
        const oldKey = randomKey();
        const newKey = randomKey();

        // Encrypt with old key
        const encrypter = new Encrypter(oldKey);
        const encrypted = await encrypter.encrypt('rotated secret');

        // Decrypt with new key as primary, old key as fallback
        const decrypter = new Decrypter([newKey, oldKey]);
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('rotated secret');
    });

    it('decrypts data encrypted with new key', async () => {
        const oldKey = randomKey();
        const newKey = randomKey();

        // Encrypt with new key
        const encrypter = new Encrypter(newKey);
        const encrypted = await encrypter.encrypt('new secret');

        // Decrypt with both keys available
        const decrypter = new Decrypter([newKey, oldKey]);
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('new secret');
    });
});

describe('deriveKey', () => {
    it('derives a 32-byte key from a string', async () => {
        const key = await deriveKey('my-secret');
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBe(ENCRYPTION_KEY_BYTES);
    });

    it('produces the same key for the same string', async () => {
        const a = await deriveKey('deterministic');
        const b = await deriveKey('deterministic');
        expect(a).toEqual(b);
    });

    it('produces different keys for different strings', async () => {
        const a = await deriveKey('secret-one');
        const b = await deriveKey('secret-two');
        expect(a).not.toEqual(b);
    });

    it('passes through a valid Uint8Array', async () => {
        const raw = randomKey();
        const key = await deriveKey(raw);
        expect(key).toBe(raw);
    });

    it('rejects a Uint8Array with wrong length', async () => {
        await expect(deriveKey(new Uint8Array(16))).rejects.toThrow('Encryption key must be 32 bytes');
    });
});

describe('String key encryption', () => {
    it('encrypts and decrypts with a string-derived key', async () => {
        const key = await deriveKey('my-secret-key');
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('hello world');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('hello world');
    });

    it('supports key rotation with mixed string and Uint8Array keys', async () => {
        const oldKey = await deriveKey('old-secret');
        const newKey = randomKey();

        // Encrypt with old string-derived key
        const encrypter = new Encrypter(oldKey);
        const encrypted = await encrypter.encrypt('rotated data');

        // Decrypt with new Uint8Array key as primary, old string-derived as fallback
        const decrypter = new Decrypter([newKey, oldKey]);
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('rotated data');
    });
});

describe('Custom encryption', () => {
    it('uses custom encrypt/decrypt functions', async () => {
        const config: CustomEncryption = {
            encrypt: vi.fn(async (_model, _field, plain) => `ENC:${plain}`),
            decrypt: vi.fn(async (_model, _field, cipher) => cipher.replace('ENC:', '')),
        };

        const encrypted = await config.encrypt('User', {} as unknown as FieldDef, 'secret');
        expect(encrypted).toBe('ENC:secret');

        const decrypted = await config.decrypt('User', {} as unknown as FieldDef, encrypted);
        expect(decrypted).toBe('secret');

        expect(config.encrypt).toHaveBeenCalledTimes(1);
        expect(config.decrypt).toHaveBeenCalledTimes(1);
    });

    it('receives model and field parameters', async () => {
        const config: CustomEncryption = {
            encrypt: vi.fn(async (model, field, plain) => `${model}:${field.name}:${plain}`),
            decrypt: vi.fn(async (_model, _field, cipher) => cipher.split(':')[2]!),
        };

        const field = { name: 'secretToken', type: 'String' } as unknown as FieldDef;
        const encrypted = await config.encrypt('User', field, 'value');
        expect(encrypted).toBe('User:secretToken:value');

        const decrypted = await config.decrypt('User', field, encrypted);
        expect(decrypted).toBe('value');
    });

    it('propagates errors from custom functions', async () => {
        const config: CustomEncryption = {
            encrypt: async () => {
                throw new Error('KMS unavailable');
            },
            decrypt: async () => {
                throw new Error('KMS unavailable');
            },
        };

        await expect(config.encrypt('User', {} as unknown as FieldDef, 'value')).rejects.toThrow('KMS unavailable');
        await expect(config.decrypt('User', {} as unknown as FieldDef, 'value')).rejects.toThrow('KMS unavailable');
    });
});

describe('isCustomEncryption', () => {
    it('returns true for custom config', () => {
        expect(
            isCustomEncryption({
                encrypt: async () => '',
                decrypt: async () => '',
            }),
        ).toBe(true);
    });

    it('returns false for simple config', () => {
        expect(
            isCustomEncryption({
                key: randomKey(),
            }),
        ).toBe(false);
    });
});
