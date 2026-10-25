import { webcrypto } from 'node:crypto';

// jsdom's crypto has no subtle, which browsers have; Node's stands in for hashing.
if (!('subtle' in globalThis.crypto)) Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle });
