# zenstack-encryption

A [ZenStack](https://zenstack.dev) v3 community plugin that provides transparent field-level encryption and decryption using the `@encrypted` attribute.

## Features

- **AES-256-GCM** encryption via the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (no native dependencies)
- **Transparent** encrypt-on-write, decrypt-on-read through ZenStack's `onQuery` plugin hook
- **Key rotation** — add previous keys to a fallback list so existing data can still be decrypted while new writes use the latest key
- **Custom encryption** — bring your own encrypt/decrypt functions for KMS integration, envelope encryption, etc.
- **Nested writes** — handles `create`, `createMany`, `update`, `updateMany`, `upsert`, and `connectOrCreate` across relations

## How It Works

The plugin hooks into the ZenStack ORM's query lifecycle via `onQuery`. When a write operation (`create`, `update`, etc.) is performed, the plugin inspects the schema for fields marked `@encrypted` and encrypts their values before they reach the database. When data is read back, encrypted fields are automatically decrypted before being returned to the caller.

```
Write path:  app → plugin encrypts @encrypted fields → database
Read path:   database → plugin decrypts @encrypted fields → app
```

Encrypted values are stored as a base64 string with the format `{metadata}.{ciphertext}`, where metadata includes the encryption version, algorithm, and a key digest (used for key rotation lookups). Each encryption uses a random 12-byte IV, so the same plaintext produces different ciphertext every time.

> **Note:** Because the plugin operates at the ORM level, direct Kysely query builder calls (`client.$qb`) bypass encryption entirely.

## Installation

```bash
# npm
npm install zenstack-encryption

# pnpm
pnpm add zenstack-encryption
```

## Setup

### 1. Register the plugin in your ZModel schema

Add a `plugin` block to your `.zmodel` file. This makes the `@encrypted` attribute available in your schema:

```zmodel
plugin encryption {
    provider = 'zenstack-encryption'
}
```

### 2. Mark fields with `@encrypted`

Apply `@encrypted` to any `String` field you want to encrypt at rest:

```zmodel
model User {
    id          String @id @default(cuid())
    email       String @unique
    name        String?
    secretToken String @encrypted
    posts       Post[]
}

model Post {
    id        String @id @default(cuid())
    title     String
    content   String? @encrypted
    author    User   @relation(fields: [authorId], references: [id])
    authorId  String
}
```

### 3. Generate your schema

```bash
npx zenstack generate
```

### 4. Configure the plugin at runtime

```typescript
import { ZenStackClient } from '@zenstackhq/orm';
import { createEncryptionPlugin } from 'zenstack-encryption';
import schema from './schema.js';

// Pass a string secret — it will be derived to a 32-byte key via SHA-256
const encryptionPlugin = createEncryptionPlugin({
    encryptionKey: process.env.ENCRYPTION_SECRET!,
});

// Or pass a raw 32-byte Uint8Array if you already have one
// const encryptionPlugin = createEncryptionPlugin({
//     encryptionKey: new Uint8Array(Buffer.from(process.env.ENCRYPTION_KEY!, 'base64')),
// });

const client = new ZenStackClient(schema, {
    plugins: [encryptionPlugin],
});

// Fields are encrypted/decrypted transparently
const user = await client.user.create({
    data: {
        email: 'alice@example.com',
        secretToken: 'super-secret-value',
    },
});

console.log(user.secretToken); // → "super-secret-value" (decrypted)
```

## Key Rotation

When you need to rotate encryption keys, pass old keys via `decryptionKeys`. The plugin will use the primary `encryptionKey` for new writes, but try all keys (primary + decryption) when decrypting. Both strings and `Uint8Array` keys can be mixed:

```typescript
const plugin = createEncryptionPlugin({
    encryptionKey: 'new-secret',          // used for all new encryptions
    decryptionKeys: ['old-secret'],       // tried during decryption alongside encryptionKey
});
```

This enables zero-downtime key rotation:

1. Deploy with both keys configured (new key as primary, old key in `decryptionKeys`)
2. Existing data encrypted with the old key is still readable
3. New writes use the new key
4. Optionally re-encrypt old data by reading and updating records

## Custom Encryption

For integration with AWS KMS, HashiCorp Vault, or any other encryption provider, pass custom `encrypt` and `decrypt` functions:

```typescript
import type { FieldDef } from '@zenstackhq/orm/schema';

const plugin = createEncryptionPlugin({
    encrypt: async (model: string, field: FieldDef, plaintext: string) => {
        // Call your encryption service
        return await myKms.encrypt(plaintext);
    },
    decrypt: async (model: string, field: FieldDef, ciphertext: string) => {
        // Call your decryption service
        return await myKms.decrypt(ciphertext);
    },
});
```

The `model` and `field` parameters let you use different keys or strategies per model/field.

## Adding to an existing client

You can also add the plugin to an existing `ZenStackClient` instance using `$use`:

```typescript
const baseClient = new ZenStackClient(schema);
const client = baseClient.$use(createEncryptionPlugin({ encryptionKey }));
```

## Security Notes

When passing a string as `encryptionKey`, the plugin derives a 32-byte key using SHA-256. This is **not** a password-based key derivation function — it does not use salting or iterations. Your string secret should be **high-entropy** (e.g. a random 32+ character token from a secrets manager, not a human-chosen password).

```bash
# Good: generate a random secret
openssl rand -base64 32

# Bad: weak password
ENCRYPTION_SECRET="password123"
```

If you need to derive keys from low-entropy passwords, use a proper KDF (PBKDF2, Argon2) yourself and pass the resulting `Uint8Array` directly.

## Limitations

- **ORM only** — only applies to ORM CRUD operations, not direct Kysely query builder calls via `client.$qb`
- **String fields only** — `@encrypted` can only be applied to `String` fields. Applying `@encrypted` to non-String fields will log a warning at runtime and be ignored.
- **No encrypted filtering** — encrypted fields **cannot** be used in `where` clauses, `orderBy`, or unique constraints. Since encryption is non-deterministic (each encryption produces different ciphertext due to random IVs), queries like `where: { secretField: 'value' }` will never match. If you need to search by a field, don't encrypt it — or store a separate non-encrypted hash for lookups.
- **Storage overhead** — encrypted values are larger than the original plaintext. Expect roughly **80 bytes of overhead** per field (IV + GCM tag + metadata + base64 encoding), plus ~37% expansion of the plaintext itself. A 100-character plaintext becomes ~215 characters. Ensure your database columns use `TEXT` or a sufficiently large `VARCHAR`.

## License

MIT
