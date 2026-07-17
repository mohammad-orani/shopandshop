// storage/index.js — selects the active storage backend at require-time via
// STORAGE_DRIVER=local|r2 (defaults to "local" so existing deployments that
// don't set this var keep behaving exactly as before). Both adapters expose
// the same interface:
//   save(buffer, key, contentType) -> Promise<void>
//   getUrl(key, req) -> string   (req is only used by the local adapter)

const DRIVER = (process.env.STORAGE_DRIVER || 'local').trim().toLowerCase();

const ADAPTERS = {
    local: './localStorage',
    r2:    './r2Storage'
};

if (!ADAPTERS[DRIVER]) {
    throw new Error(`Unknown STORAGE_DRIVER "${process.env.STORAGE_DRIVER}" — expected "local" or "r2".`);
}

console.log(`📦 Image storage driver: ${DRIVER}`);

module.exports = require(ADAPTERS[DRIVER]);
