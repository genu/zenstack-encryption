import { describe, expect, it } from 'vitest';
import { Decrypter } from '../src/decrypter.js';
import { Encrypter } from '../src/encrypter.js';
import { isCustomEncryption } from '../src/types.js';
import { ENCRYPTION_KEY_BYTES } from '../src/utils.js';

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
                encryptionKey: randomKey(),
            }),
        ).toBe(false);
    });
});
