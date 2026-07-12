// Regenerates frontend/dist/{css,js} from the source .css/.js files in
// frontend/. Run this (npm run build) after editing any source file —
// the HTML pages load the dist/ output, not the source files directly.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const DIST_CSS = path.join(FRONTEND, 'dist', 'css');
const DIST_JS = path.join(FRONTEND, 'dist', 'js');

fs.mkdirSync(DIST_CSS, { recursive: true });
fs.mkdirSync(DIST_JS, { recursive: true });

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const execOpts = { stdio: 'inherit', shell: process.platform === 'win32' };

const cssFiles = fs.readdirSync(FRONTEND).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
    const src = path.join(FRONTEND, file);
    const out = path.join(DIST_CSS, file.replace(/\.css$/, '.min.css'));
    execFileSync(npxCmd, ['--no-install', 'cleancss', '-o', out, src], execOpts);
    console.log('minified', file);
}

const jsFiles = fs.readdirSync(FRONTEND).filter(f => f.endsWith('.js'));
for (const file of jsFiles) {
    const src = path.join(FRONTEND, file);
    const out = path.join(DIST_JS, file.replace(/\.js$/, '.min.js'));
    execFileSync(npxCmd, ['--no-install', 'terser', src, '-o', out, '--compress', '--mangle', '--comments', 'false'], execOpts);
    console.log('minified', file);
}

console.log('Done —', cssFiles.length, 'CSS and', jsFiles.length, 'JS files rebuilt into frontend/dist/.');
