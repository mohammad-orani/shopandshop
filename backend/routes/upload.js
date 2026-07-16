// routes/upload.js — generic image upload endpoint shared by every admin
// image picker (product main/additional images, banner images, ...). One
// file per request; the frontend calls this once per selected file.
//
// Different callers want different treatment (a product photo isn't the
// same shape as a 2.4:1 hero banner), so the upload is parameterized by an
// optional ?type= query param resolved to a profile below. Omitting it (or
// passing an unrecognized value) keeps the original product behavior byte
// for byte, so every existing caller is unaffected.

const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'uploads');

const UPLOAD_PROFILES = {
    product: {
        subdir:    'products',
        maxBytes:  10 * 1024 * 1024,
        resize:    { width: 1600, height: 1600 }, // longest side capped at 1600
        mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
    },
    banner: {
        subdir:    'banners',
        maxBytes:  8 * 1024 * 1024,
        resize:    { width: 1920, height: 800 },  // fits inside the recommended 2.4:1 box
        mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp'])
    }
};

function resolveProfile(req) {
    return UPLOAD_PROFILES[req.query.type] || UPLOAD_PROFILES.product;
}

// Multer's own limit is just the outer safety net (largest of all profiles);
// the actual per-profile byte cap is enforced after the file is in memory,
// once we know which profile applies.
const MAX_UPLOAD_BYTES_CEILING = Math.max(...Object.values(UPLOAD_PROFILES).map(p => p.maxBytes));

Object.values(UPLOAD_PROFILES).forEach(profile => {
    fs.mkdirSync(path.join(PUBLIC_DIR, profile.subdir), { recursive: true });
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES_CEILING },
    fileFilter(req, file, cb) {
        const profile = resolveProfile(req);
        if (!profile.mimeTypes.has(file.mimetype)) {
            return cb(new Error('UNSUPPORTED_FILE_TYPE'));
        }
        cb(null, true);
    }
});

function randomFilename() {
    return crypto.randomBytes(16).toString('hex') + '.webp';
}

// The admin panel, storefront, and backend are three separate origins in
// this deployment (Netlify + Netlify + Railway — see the CORS allowlist in
// server.js), so a path-only URL like "/uploads/products/x.webp" would
// resolve against whichever of those origins is *displaying* the image, not
// the backend that actually stores it, and 404. Build a full URL back to
// this server instead. Railway (and most platforms) terminate TLS at a
// proxy and forward plain HTTP, so read X-Forwarded-Proto/Host rather than
// relying on req.protocol, which would otherwise report "http" even in
// production.
function getPublicOrigin(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host  = req.headers['x-forwarded-host']  || req.get('host');
    return `${proto}://${host}`;
}

// POST /api/upload?type=product|banner — multipart/form-data, field name "image"
// (?type= defaults to "product" when omitted or unrecognized)
router.post('/', authenticateToken, isAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        const profile = resolveProfile(req);

        if (err) {
            if (err.message === 'UNSUPPORTED_FILE_TYPE') {
                const exts = [...profile.mimeTypes].map(m => m.split('/')[1].toUpperCase()).join(', ');
                return res.status(400).json({ success: false, error: `Unsupported file type. Please upload a ${exts} image.` });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: `File is too large. Maximum size is ${MAX_UPLOAD_BYTES_CEILING / (1024 * 1024)}MB.` });
            }
            return res.status(400).json({ success: false, error: 'Upload failed: ' + err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        if (req.file.size > profile.maxBytes) {
            return res.status(400).json({ success: false, error: `File is too large. Maximum size is ${profile.maxBytes / (1024 * 1024)}MB.` });
        }

        try {
            // Don't trust the client-supplied mimetype alone — re-verify the
            // buffer actually decodes as an image before writing anything.
            const image = sharp(req.file.buffer, { failOn: 'error' });
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Not a decodable image');
            }

            const uploadDir = path.join(PUBLIC_DIR, profile.subdir);

            // Collision-free filename (belt-and-suspenders on top of the
            // 128-bit random name — collisions are effectively impossible,
            // but this makes the guarantee explicit rather than assumed).
            let filename, destPath;
            do {
                filename = randomFilename();
                destPath = path.join(uploadDir, filename);
            } while (fs.existsSync(destPath));

            // Auto-orient from EXIF, fit inside the profile's target box
            // (never upscale, aspect ratio preserved via `fit: 'inside'`),
            // re-encode as compressed WebP.
            await image
                .rotate()
                .resize({
                    width: profile.resize.width,
                    height: profile.resize.height,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 82 })
                .toFile(destPath);

            const url = `${getPublicOrigin(req)}/uploads/${profile.subdir}/${filename}`;
            await logAction(req, 'CREATE', 'upload', filename,
                `Uploaded ${profile.subdir.slice(0, -1)} image (${metadata.width}x${metadata.height} → WebP)`);
            res.json({ success: true, url });
        } catch (procErr) {
            console.error('Image processing error:', procErr.message);
            res.status(400).json({ success: false, error: 'The uploaded file is not a valid image.' });
        }
    });
});

module.exports = router;
