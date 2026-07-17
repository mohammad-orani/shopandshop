// storage/r2Storage.js — stores files in Cloudflare R2 (S3-compatible object
// storage), fully decoupled from this server's own disk and lifecycle.
// Recommended for any deployment where the compute instance's filesystem
// isn't guaranteed to persist (Railway, most PaaS) or might ever scale to
// multiple instances.

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// R2's S3-compatible endpoint is account-scoped: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// R2_PUBLIC_URL is the bucket's public read URL (the R2.dev subdomain Cloudflare
// gives you, or a custom domain mapped to the bucket) — object keys are appended
// to it directly, so it must not have a trailing slash.
const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME       = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL        = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

const R2_CONFIGURED = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);

if (!R2_CONFIGURED) {
    console.warn('⚠️  STORAGE_DRIVER=r2 but R2 is not fully configured (need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL) — uploads will fail until these are set.');
}

const s3 = R2_CONFIGURED ? new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
    }
}) : null;

async function save(buffer, key, contentType) {
    if (!R2_CONFIGURED) {
        throw new Error('R2 storage is not configured (missing R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME/R2_PUBLIC_URL).');
    }
    await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable'
    }));
}

function getUrl(key) {
    return `${R2_PUBLIC_URL}/${key}`;
}

module.exports = { save, getUrl, R2_CONFIGURED, R2_PUBLIC_URL };
