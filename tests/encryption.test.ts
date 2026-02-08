import { describe, expect, it } from 'vitest';
import { Decrypter } from '../src/decrypter.js';
import { Encrypter } from '../src/encrypter.js';
import { isCustomEncryption } from '../src/types.js';
import { deriveKey, ENCRYPTION_KEY_BYTES } from '../src/utils.js';

function randomKey(): Uint8Array {
    const key = new Uint8Array(ENCRYPTION_KEY_BYTES);
    crypto.getRandomValues(key);
    return key;
}

describe('Encrypt / Decrypt', () => {
    it('roundtrips plaintext through encrypt and decrypt', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('secret message');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('secret message');
    });

    it('roundtrips empty string', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('');
    });

    it('roundtrips unicode content', async () => {
        const key = randomKey();
        const encrypter = new Encrypter(key);
        const decrypter = new Decrypter([key]);

        const encrypted = await encrypter.encrypt('hello 🌍 world');
        const decrypted = await decrypter.decrypt(encrypted);
        expect(decrypted).toBe('hello 🌍 world');
    });

    it('throws on malformed data', async () => {
        const decrypter = new Decrypter([randomKey()]);
        await expect(decrypter.decrypt('not-encrypted')).rejects.toThrow('Malformed encrypted data');
    });

    it('throws on wrong key', async () => {
        const encrypter = new Encrypter(randomKey());
        const decrypter = new Decrypter([randomKey()]);

        const encrypted = await encrypter.encrypt('secret');
        await expect(decrypter.decrypt(encrypted)).rejects.toThrow();
    });
});

describe('Key rotation', () => {
    it('decrypts old ciphertext after key rotation', async () => {
        const oldKey = randomKey();
        const newKey = randomKey();

        const encrypted = await new Encrypter(oldKey).encrypt('rotated secret');
        const decrypted = await new Decrypter([newKey, oldKey]).decrypt(encrypted);
        expect(decrypted).toBe('rotated secret');
    });

    it('works with mixed string and Uint8Array keys', async () => {
        const oldKey = await deriveKey('old-secret');
        const newKey = randomKey();

        const encrypted = await new Encrypter(oldKey).encrypt('rotated data');
        const decrypted = await new Decrypter([newKey, oldKey]).decrypt(encrypted);
        expect(decrypted).toBe('rotated data');
    });
});

describe('isCustomEncryption', () => {
    it('distinguishes custom from simple config', () => {
        expect(isCustomEncryption({ encrypt: async () => '', decrypt: async () => '' })).toBe(true);
        expect(isCustomEncryption({ key: randomKey() })).toBe(false);
    });
});
