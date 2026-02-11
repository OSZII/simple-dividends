import { LRUCache } from 'lru-cache';
import { dev } from '$app/environment';

const options = {
    // Option A: Limit by number of items
    max: dev ? 1 : 1000,

    // Option B: Limit by total memory size (e.g., 500MB)
    maxSize: dev ? 1 : 500 * 1024 * 1024,
    sizeCalculation: (value: any, key: any) => {
        // Estimate size in bytes
        return Buffer.byteLength(JSON.stringify(value) + key);
    },

    // How long to keep items (e.g., 24 hours)
    ttl: dev ? 1 : 1000 * 60 * 60 * 24,
};

// This instance is created once and shared across the app
export const globalCache = new LRUCache(options);