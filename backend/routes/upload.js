// routes/upload.js — generic image upload endpoint shared by every admin
// image picker (product main/additional images, banner images, ...). One
// file per request; the frontend calls this once per selected file.
//
// Where the processed image actually gets stored is decided by
// storage/index.js via STORAGE_DRIVER=local|r2 — this route only handles
// validation, processing, and delegating to whichever adapter is active.
// See storage/localStorage.js and storage/r2Storage.js for the tradeoffs
// (local disk on most PaaS, including Railway, is ephemeral and doesn't
// survive a redeploy; R2 is fully decoupled from the compute instance).
//
// Different callers want different treatment (a product photo isn't the
// same shape as a 2.4:1 hero banner), so the upload is parameterized by an
// optional ?type= query param resolved to a profile below. Omitting it (or
// passing an unrecognized value) defaults to the product profile.

const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const crypto  = require('crypto');
const storage = require('../storage');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

const UPLOAD_PROFILES = {
    product: {
        prefix:    'products',
        maxBytes:  10 * 1024 * 1024,
        resize:    { width: 1600, height: 1600 }, // longest side capped at 1600
        mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
    },
    banner: {
        prefix:    'banners',
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

        // Validate + process first (client's fault if this fails — 400).
        let metadata, webpBuffer;
        try {
            // Don't trust the client-supplied mimetype alone — re-verify the
            // buffer actually decodes as an image before processing it.
            const image = sharp(req.file.buffer, { failOn: 'error' });
            metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Not a decodable image');
            }

            // Auto-orient from EXIF, fit inside the profile's target box
            // (never upscale, aspect ratio preserved via `fit: 'inside'`),
            // re-encode as compressed WebP.
            webpBuffer = await image
                .rotate()
                .resize({
                    width: profile.resize.width,
                    height: profile.resize.height,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 82 })
                .toBuffer();
        } catch (procErr) {
            console.error('Image processing error:', procErr.message);
            return res.status(400).json({ success: false, error: 'The uploaded file is not a valid image.' });
        }

        // Then store it via whichever driver is active (our fault if this
        // fails — 502, not the client's).
        const filename = randomFilename();
        const key = `${profile.prefix}/${filename}`;
        try {
            await storage.save(webpBuffer, key, 'image/webp');
        } catch (storageErr) {
            console.error('Storage error:', storageErr.message);
            return res.status(502).json({ success: false, error: 'Failed to store the image. Please try again.' });
        }

        const url = storage.getUrl(key, req);
        await logAction(req, 'CREATE', 'upload', filename,
            `Uploaded ${profile.prefix.slice(0, -1)} image (${metadata.width}x${metadata.height} → WebP)`);
        res.json({ success: true, url });
    });
});

module.exports = router;
