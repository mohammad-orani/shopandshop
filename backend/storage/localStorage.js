// storage/localStorage.js — stores files on this server's own disk, served
// back out via express.static('public') in server.js.
//
// Note: on Railway (and most PaaS), this directory lives on the container's
// ephemeral filesystem and is wiped on every redeploy. It's kept as a
// supported driver for local development and for deployments that persist
// their own disk (e.g. a Railway Volume mounted here, or a VM/VPS) — pick
// STORAGE_DRIVER=r2 for anything where the disk isn't guaranteed to survive
// a redeploy.

const fs   = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');

async function save(buffer, key) {
    const destPath = path.join(UPLOAD_ROOT, key);
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, buffer);
}

// Mirrors the request's own scheme/host rather than a fixed base URL, since
// there's no single "public origin" for a file living on this server —
// admin, storefront, and backend are three separate origins here (see the
// CORS allowlist in server.js), so the URL has to point back to whichever
// host actually received the upload. Railway (and most platforms) terminate
// TLS at a proxy and forward plain HTTP, so read X-Forwarded-Proto/Host
// rather than relying on req.protocol, which would otherwise report "http"
// even in production.
function getUrl(key, req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host  = req.headers['x-forwarded-host']  || req.get('host');
    return `${proto}://${host}/uploads/${key}`;
}

module.exports = { save, getUrl };
