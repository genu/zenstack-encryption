import { _decrypt, ENCRYPTION_KEY_BYTES, getKeyDigest, loadKey } from './utils.js';

/**
 * Default decrypter with support for key rotation
 */
export class Decrypter {
    private keys: Array<{ key: CryptoKey; digest: string }> = [];
    private initPromise: Promise<void> | undefined;

    constructor(private readonly decryptionKeys: Uint8Array[]) {
        if (decryptionKeys.length === 0) {
            throw new Error('At least one decryption key must be provided');
        }

        for (const key of decryptionKeys) {
            if (key.length !== ENCRYPTION_KEY_BYTES) {
                throw new Error(`Decryption key must be ${ENCRYPTION_KEY_BYTES} bytes`);
            }
        }
    }

    private async ensureKeys(): Promise<void> {
        if (this.keys.length > 0) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.keys = await Promise.all(
                this.decryptionKeys.map(async (key) => ({
                    key: await loadKey(key, ['decrypt']),
                    digest: await getKeyDigest(key),
                })),
            );
        })();

        return this.initPromise;
    }

    /**
     * Decrypts the given data
     */
    async decrypt(data: string): Promise<string> {
        await this.ensureKeys();

        return _decrypt(data, async (digest) =>
            this.keys.filter((entry) => entry.digest === digest).map((entry) => entry.key),
        );
    }
}
