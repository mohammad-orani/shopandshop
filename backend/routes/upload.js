// routes/upload.js — generic image upload endpoint used by the admin panel's
// product image pickers (main image + additional images). One file per
// request; the frontend calls this once per selected file.

const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'products');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_UPLOAD_BYTES   = 10 * 1024 * 1024; // raw upload cap, before compression
const MAX_DIMENSION      = 1600;             // longest side after resize
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter(req, file, cb) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
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

// POST /api/upload — multipart/form-data, field name "image"
router.post('/', authenticateToken, isAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            if (err.message === 'UNSUPPORTED_FILE_TYPE') {
                return res.status(400).json({ success: false, error: 'Unsupported file type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image.' });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: 'File is too large. Maximum size is 10MB.' });
            }
            return res.status(400).json({ success: false, error: 'Upload failed: ' + err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        try {
            // Don't trust the client-supplied mimetype alone — re-verify the
            // buffer actually decodes as an image before writing anything.
            const image = sharp(req.file.buffer, { failOn: 'error' });
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Not a decodable image');
            }

            // Collision-free filename (belt-and-suspenders on top of the
            // 128-bit random name — collisions are effectively impossible,
            // but this makes the guarantee explicit rather than assumed).
            let filename, destPath;
            do {
                filename = randomFilename();
                destPath = path.join(UPLOAD_DIR, filename);
            } while (fs.existsSync(destPath));

            // Auto-orient from EXIF, cap the longest side (never upscale,
            // aspect ratio preserved via `fit: 'inside'`), re-encode as
            // compressed WebP.
            await image
                .rotate()
                .resize({
                    width: MAX_DIMENSION,
                    height: MAX_DIMENSION,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 82 })
                .toFile(destPath);

            const url = `${getPublicOrigin(req)}/uploads/products/${filename}`;
            await logAction(req, 'CREATE', 'upload', filename,
                `Uploaded image (${metadata.width}x${metadata.height} → WebP)`);
            res.json({ success: true, url });
        } catch (procErr) {
            console.error('Image processing error:', procErr.message);
            res.status(400).json({ success: false, error: 'The uploaded file is not a valid image.' });
        }
    });
});

module.exports = router;
