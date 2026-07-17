#!/usr/bin/env node
// scripts/migrate-to-r2.js — one-off CLI migration: moves existing product
// and banner images from wherever they're currently served (local disk,
// whether on this machine or a Railway deploy that's since been wiped) into
// Cloudflare R2, and repoints the database rows at the new R2 URLs.
//
// This is NOT run automatically by the server anywhere — it's a manual,
// explicit step you run yourself when you're ready to cut over. It does
// nothing to break URLs it doesn't touch: any image_url that isn't one of
// this app's own /uploads/products/* or /uploads/banners/* URLs (e.g. an
// admin-pasted external link) is left completely alone, and continues to be
// served exactly as it is today via express.static — nothing about this
// script or the storage-driver change removes that route.
//
// Safe to run more than once — anything already pointing at R2 is skipped,
// and any single file's failure (e.g. a dead link from a wiped ephemeral
// disk) is recorded in the report and does not stop the rest of the run.
//
// Usage:
//   node scripts/migrate-to-r2.js                     Dry run — fetches and
//                                                       reports what WOULD
//                                                       happen. No writes to
//                                                       R2 or the database.
//   node scripts/migrate-to-r2.js --execute            Actually uploads to
//                                                       R2 and updates the DB.
//   node scripts/migrate-to-r2.js --execute --product-id=12
//   node scripts/migrate-to-r2.js --execute --banner-id=3
//                                                       Scope to a single
//                                                       record (repeat either
//                                                       flag to add more IDs;
//                                                       useful for retrying
//                                                       just the records that
//                                                       failed on a prior run).

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../db');
const r2   = require('../storage/r2Storage');

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const PRODUCT_ID_FILTER = args.filter(a => a.startsWith('--product-id=')).map(a => a.split('=')[1]);
const BANNER_ID_FILTER  = args.filter(a => a.startsWith('--banner-id=')).map(a => a.split('=')[1]);

// ==================== URL CLASSIFICATION ====================

// Matches this app's own upload URLs regardless of which host is currently
// serving them (localhost during dev, a Railway domain, a custom domain,
// R2 itself) — anything else (a manually pasted external link) is left
// completely untouched.
function parseOwnUploadUrl(url) {
    if (!url || typeof url !== 'string') return null;
    let u;
    try { u = new URL(url); } catch (e) { return null; }
    const m = u.pathname.match(/\/uploads\/(products|banners)\/([^/?#]+)$/);
    if (!m) return null;
    return { prefix: m[1], filename: m[2], key: `${m[1]}/${m[2]}` };
}

function isAlreadyOnR2(url) {
    return !!(r2.R2_PUBLIC_URL && url && url.startsWith(r2.R2_PUBLIC_URL + '/'));
}

// Mirrors the same JSON-array-or-comma-separated fallback used in
// admin/admin.js's editProduct() — older rows may predate the JSON-array
// convention.
function parseAdditionalImages(raw) {
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* fall through */ }
    return String(raw).split(',').map(s => s.trim()).filter(Boolean);
}

async function fetchBytes(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error('empty response body');
    return buf;
}

// Migrates a single URL. Always fetches the source (even in dry-run) so the
// report reflects what would actually succeed or fail, not just intent —
// only the R2 write is gated by EXECUTE.
async function migrateOneUrl(url) {
    if (!url) return { action: 'skip-empty', url };
    if (isAlreadyOnR2(url)) return { action: 'skip-already-r2', url };

    const parsed = parseOwnUploadUrl(url);
    if (!parsed) return { action: 'skip-external', url };

    try {
        const bytes = await fetchBytes(url);
        const newUrl = r2.getUrl(parsed.key);
        if (EXECUTE) {
            await r2.save(bytes, parsed.key, 'image/webp');
        }
        return { action: EXECUTE ? 'migrated' : 'would-migrate', url, newUrl, bytes: bytes.length };
    } catch (err) {
        return { action: 'failed', url, error: err.message };
    }
}

// ==================== MAIN ====================

async function run() {
    // A dry run only needs R2_PUBLIC_URL to compute preview URLs — it never
    // uploads anything, so it's useful even before a bucket/API token exist.
    // --execute needs the full credential set, since it actually writes.
    if (!r2.R2_PUBLIC_URL) {
        console.error('R2_PUBLIC_URL is not set — set at least this (see backend/.env.example) to preview a migration.');
        process.exitCode = 1;
        return;
    }
    if (EXECUTE && !r2.R2_CONFIGURED) {
        console.error('R2 is not fully configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL before running with --execute.');
        process.exitCode = 1;
        return;
    }

    console.log(EXECUTE
        ? '=== MIGRATION — writes to R2 and the database ARE enabled ==='
        : '=== DRY RUN — no writes to R2 or the database. Pass --execute to apply. ===');
    if (PRODUCT_ID_FILTER.length) console.log(`Scoped to product id(s): ${PRODUCT_ID_FILTER.join(', ')}`);
    if (BANNER_ID_FILTER.length)  console.log(`Scoped to banner id(s): ${BANNER_ID_FILTER.join(', ')}`);
    console.log('');

    const report = { startedAt: new Date().toISOString(), executed: EXECUTE, products: [], banners: [] };

    // When either --product-id or --banner-id is given, that flag's table is
    // scoped to the listed id(s) and the OTHER table is skipped entirely —
    // not just left unfiltered. Retrying a single failed product must never
    // also silently reprocess every banner (and vice versa).
    const SCOPED = PRODUCT_ID_FILTER.length > 0 || BANNER_ID_FILTER.length > 0;
    const RUN_PRODUCTS = !SCOPED || PRODUCT_ID_FILTER.length > 0;
    const RUN_BANNERS  = !SCOPED || BANNER_ID_FILTER.length > 0;

    // ---- Products: image_url + additional_images ----
    let productQuery = 'SELECT id, image_url, additional_images FROM products';
    const productParams = [];
    if (PRODUCT_ID_FILTER.length) {
        productQuery += ` WHERE id IN (${PRODUCT_ID_FILTER.map(() => '?').join(',')})`;
        productParams.push(...PRODUCT_ID_FILTER);
    }
    const [products] = RUN_PRODUCTS ? await pool.query(productQuery, productParams) : [[]];

    for (const p of products) {
        const entry = { id: p.id, image_url: null, additional_images: [] };

        const mainResult = await migrateOneUrl(p.image_url);
        entry.image_url = mainResult;
        if (mainResult.action === 'migrated') {
            await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [mainResult.newUrl, p.id]);
        }

        const images = parseAdditionalImages(p.additional_images);
        if (images.length) {
            const results = [];
            let changed = false;
            const newImages = [];
            for (const imgUrl of images) {
                const r = await migrateOneUrl(imgUrl);
                results.push(r);
                if (r.action === 'migrated') { newImages.push(r.newUrl); changed = true; }
                else newImages.push(imgUrl);
            }
            entry.additional_images = results;
            if (changed) {
                await pool.query('UPDATE products SET additional_images = ? WHERE id = ?', [JSON.stringify(newImages), p.id]);
            }
        }

        report.products.push(entry);
        logEntry('product', p.id, entry);
    }

    // ---- Banners: image_url ----
    let bannerQuery = 'SELECT id, image_url FROM banners';
    const bannerParams = [];
    if (BANNER_ID_FILTER.length) {
        bannerQuery += ` WHERE id IN (${BANNER_ID_FILTER.map(() => '?').join(',')})`;
        bannerParams.push(...BANNER_ID_FILTER);
    }
    const [banners] = RUN_BANNERS ? await pool.query(bannerQuery, bannerParams) : [[]];

    for (const b of banners) {
        const result = await migrateOneUrl(b.image_url);
        if (result.action === 'migrated') {
            await pool.query('UPDATE banners SET image_url = ? WHERE id = ?', [result.newUrl, b.id]);
        }
        report.banners.push({ id: b.id, image_url: result });
        logEntry('banner', b.id, { image_url: result, additional_images: [] });
    }

    report.finishedAt = new Date().toISOString();
    printSummary(report);
    writeReportFile(report);

    await pool.end();
}

function logEntry(kind, id, entry) {
    const all = [entry.image_url, ...(entry.additional_images || [])].filter(Boolean);
    for (const r of all) {
        const icon = { migrated: '✅', 'would-migrate': '🔎', 'skip-already-r2': '⏭️ ', 'skip-external': '⏭️ ', 'skip-empty': '⏭️ ', failed: '❌' }[r.action] || '•';
        console.log(`${icon} ${kind} #${id} [${r.action}]${r.url ? ' ' + r.url : ''}${r.error ? ' — ' + r.error : ''}`);
    }
}

function printSummary(report) {
    const all = [
        ...report.products.flatMap(p => [p.image_url, ...p.additional_images].filter(Boolean)),
        ...report.banners.map(b => b.image_url)
    ];
    const counts = {};
    for (const r of all) counts[r.action] = (counts[r.action] || 0) + 1;

    console.log('\n=== SUMMARY ===');
    console.log(`Mode:              ${report.executed ? 'EXECUTE (writes applied)' : 'DRY RUN (no writes)'}`);
    console.log(`Products scanned:  ${report.products.length}`);
    console.log(`Banners scanned:   ${report.banners.length}`);
    console.log(`Migrated:          ${counts.migrated || 0}`);
    if (!report.executed) console.log(`Would migrate:     ${counts['would-migrate'] || 0}`);
    console.log(`Already on R2:     ${counts['skip-already-r2'] || 0}`);
    console.log(`External (skipped):${counts['skip-external'] || 0}`);
    console.log(`Empty (skipped):   ${counts['skip-empty'] || 0}`);
    console.log(`Failed:            ${counts.failed || 0}`);
    if (counts.failed) {
        console.log('\nFailed URLs (need manual attention — likely a dead link, not something this tool can fix):');
        all.filter(r => r.action === 'failed').forEach(r => console.log(`  - ${r.url} — ${r.error}`));
    }
}

function writeReportFile(report) {
    const dir = path.join(__dirname, '..', 'migration-reports');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `r2-migration-${report.startedAt.replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`\nFull report written to: backend/migration-reports/${filename}`);
}

run().catch(err => {
    console.error('Migration script failed:', err);
    process.exitCode = 1;
});
