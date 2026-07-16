// ==================== IMAGE UPLOADER COMPONENTS ====================
// Reusable file-upload widgets for the admin panel: pick a file (or files),
// preview immediately, upload automatically to POST /api/upload, track
// per-file progress, and surface errors inline. Used by the product form's
// "Main Image" (single) and "Additional Images" (multi) fields, but not
// tied to products — any form needing an image picker can reuse these.
//
// Both factories return a small controller object:
//   { getValue(), setValue(), isUploading(), hasErrors(), reset(), destroy() }
// getValue() returns a Promise that resolves once any in-flight uploads
// settle, so callers (e.g. a form submit handler) never save a blob: URL or
// a still-uploading placeholder by accident.

(function () {

    // Defaults match the backend's "product" upload profile — pass
    // acceptedTypes/maxBytes in opts to match a different profile (e.g. the
    // backend's "banner" profile accepts fewer types at a smaller size cap).
    const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    const MAX_CLIENT_SIDE_BYTES = 10 * 1024 * 1024; // mirrors the backend's limit — fail fast client-side too

    function validateFile(file, acceptedTypes = ACCEPTED_TYPES, maxBytes = MAX_CLIENT_SIDE_BYTES) {
        if (!acceptedTypes.includes(file.type)) {
            const exts = acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
            return `Unsupported file type. Please choose a ${exts} image.`;
        }
        if (file.size > maxBytes) {
            return `File is too large. Maximum size is ${maxBytes / (1024 * 1024)}MB.`;
        }
        return null;
    }

    // Uploads one file, reporting progress via onProgress(0-100). Resolves to
    // the server's returned URL, rejects with a human-readable message.
    // uploadType is sent as ?type= so the backend applies the matching
    // profile (resize target, byte cap, storage folder) — omit it for the
    // default "product" profile.
    function uploadFile(file, onProgress, uploadType) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = uploadType ? `${window.API_URL}/upload?type=${encodeURIComponent(uploadType)}` : `${window.API_URL}/upload`;
            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${getAdminToken()}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onload = () => {
                let data;
                try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
                if (xhr.status >= 200 && xhr.status < 300 && data && data.url) {
                    resolve(data.url);
                } else {
                    reject((data && data.error) || `Upload failed (${xhr.status})`);
                }
            };
            xhr.onerror = () => reject('Network error during upload');

            const formData = new FormData();
            formData.append('image', file);
            xhr.send(formData);
        });
    }

    // ==================== SINGLE IMAGE UPLOADER ====================
    // opts: { initialUrl, onChange(url), uploadType, acceptedTypes, maxBytes, extraClass }
    // uploadType/acceptedTypes/maxBytes let a caller match a different
    // backend profile (see routes/upload.js) — e.g. banners use uploadType:
    // 'banner' with a smaller size cap and fewer accepted types. extraClass
    // lets the caller size the preview slot differently (banners are a wide
    // 2.4:1 crop, not the product uploader's square thumbnail).
    function createSingleImageUploader(containerId, opts) {
        opts = opts || {};
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`createSingleImageUploader: #${containerId} not found`);

        const acceptedTypes = opts.acceptedTypes || ACCEPTED_TYPES;
        const maxBytes = opts.maxBytes || MAX_CLIENT_SIDE_BYTES;

        // state: { url, objectUrl, status: 'empty'|'uploading'|'done'|'error', progress, error, pendingUpload }
        let state = { url: opts.initialUrl || '', objectUrl: null, status: opts.initialUrl ? 'done' : 'empty', progress: 0, error: null, pendingUpload: null };

        container.innerHTML = `
            <div class="img-uploader img-uploader--single${opts.extraClass ? ' ' + opts.extraClass : ''}">
                <div class="img-uploader__slot"></div>
                <input type="file" accept="${acceptedTypes.join(',')}" hidden>
            </div>`;
        const slot = container.querySelector('.img-uploader__slot');
        const fileInput = container.querySelector('input[type="file"]');

        // Drag-and-drop: dropping a file from the OS anywhere on the slot
        // uploads it, regardless of which visual state (empty/preview/error)
        // it's currently in. Bound once here rather than in bindSlotEvents()
        // since the slot element itself (unlike its innerHTML) persists
        // across renders.
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('img-uploader__slot--drag-over');
        });
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('img-uploader__slot--drag-over');
        });
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('img-uploader__slot--drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) startUpload(file);
        });

        function render() {
            const displaySrc = state.objectUrl || state.url;
            if (state.status === 'empty') {
                slot.innerHTML = `
                    <button type="button" class="img-uploader__pick-btn">
                        <span class="img-uploader__pick-icon">📷</span> Choose Image
                    </button>`;
            } else if (state.status === 'uploading') {
                slot.innerHTML = `
                    <div class="img-uploader__preview">
                        <img src="${displaySrc}" alt="">
                        <div class="img-uploader__progress-overlay">
                            <div class="img-uploader__spinner"></div>
                            <div class="img-uploader__progress-track"><div class="img-uploader__progress-bar" style="width:${state.progress}%"></div></div>
                        </div>
                    </div>`;
            } else if (state.status === 'error') {
                slot.innerHTML = `
                    <div class="img-uploader__preview img-uploader__preview--error">
                        ${displaySrc ? `<img src="${displaySrc}" alt="">` : ''}
                        <div class="img-uploader__error-overlay">
                            <span>⚠️ ${state.error}</span>
                            <div class="img-uploader__error-actions">
                                <button type="button" class="img-uploader__retry-btn">Retry</button>
                                <button type="button" class="img-uploader__remove-btn">Remove</button>
                            </div>
                        </div>
                    </div>`;
            } else if (state.previewFailed) { // done, but the stored URL doesn't actually load
                slot.innerHTML = `
                    <div class="img-uploader__preview img-uploader__preview--error">
                        <img src="${displaySrc}" alt="" data-role="preview-img">
                        <div class="img-uploader__error-overlay">
                            <span>⚠️ Image failed to load. It may have been moved or deleted.</span>
                            <div class="img-uploader__error-actions">
                                <button type="button" class="img-uploader__change-btn">Replace</button>
                                <button type="button" class="img-uploader__remove-btn">Remove</button>
                            </div>
                        </div>
                    </div>`;
            } else { // done
                slot.innerHTML = `
                    <div class="img-uploader__preview">
                        <img src="${displaySrc}" alt="" data-role="preview-img">
                        <div class="img-uploader__hover-actions">
                            <button type="button" class="img-uploader__change-btn">Change</button>
                            <button type="button" class="img-uploader__remove-btn" aria-label="Remove image">✕</button>
                        </div>
                    </div>`;
            }
            bindSlotEvents();
        }

        function bindSlotEvents() {
            const pickBtn = slot.querySelector('.img-uploader__pick-btn');
            const changeBtn = slot.querySelector('.img-uploader__change-btn');
            const retryBtn = slot.querySelector('.img-uploader__retry-btn');
            const removeBtn = slot.querySelector('.img-uploader__remove-btn');
            const previewImg = slot.querySelector('img[data-role="preview-img"]');
            if (pickBtn) pickBtn.addEventListener('click', () => fileInput.click());
            if (changeBtn) changeBtn.addEventListener('click', () => fileInput.click());
            if (retryBtn) retryBtn.addEventListener('click', () => state.pendingFile && startUpload(state.pendingFile));
            if (removeBtn) removeBtn.addEventListener('click', clear);
            // A URL that resolved fine at save time (e.g. a link into another
            // service, or a file that's since been moved/deleted) can still
            // fail to actually load here. Surface that distinctly instead of
            // leaving the browser's broken-image icon — mirrors the onerror
            // fallback every other image in this app already has, which this
            // component was missing entirely.
            if (previewImg && state.status === 'done') {
                previewImg.addEventListener('error', () => {
                    if (state.previewFailed) return; // avoid a render loop if the same broken URL errors again
                    state.previewFailed = true;
                    render();
                });
            }
        }

        function clear() {
            if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
            state = { url: '', objectUrl: null, status: 'empty', progress: 0, error: null, pendingFile: null };
            fileInput.value = '';
            render();
            if (opts.onChange) opts.onChange('');
        }

        function startUpload(file) {
            const validationError = validateFile(file, acceptedTypes, maxBytes);
            if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
            const objectUrl = URL.createObjectURL(file);

            if (validationError) {
                state = { url: '', objectUrl, status: 'error', progress: 0, error: validationError, pendingFile: file };
                render();
                return;
            }

            state = { url: '', objectUrl, status: 'uploading', progress: 0, error: null, pendingFile: file };
            render();

            state.pendingUpload = uploadFile(file, (pct) => {
                if (state.pendingFile !== file) return; // superseded by a newer selection
                state.progress = pct;
                const bar = slot.querySelector('.img-uploader__progress-bar');
                if (bar) bar.style.width = pct + '%';
            }, opts.uploadType).then((url) => {
                if (state.pendingFile !== file) return; // superseded
                state = { url, objectUrl: state.objectUrl, status: 'done', progress: 100, error: null, pendingFile: null, pendingUpload: null };
                render();
                if (opts.onChange) opts.onChange(url);
            }).catch((err) => {
                if (state.pendingFile !== file) return; // superseded
                state.status = 'error';
                state.error = typeof err === 'string' ? err : 'Upload failed';
                state.pendingUpload = null;
                render();
            });
        }

        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) startUpload(file);
        });

        render();

        return {
            getValue() {
                return Promise.resolve(state.pendingUpload).then(() => (state.status === 'done' ? state.url : (state.status === 'error' ? '' : state.url)));
            },
            setValue(url) {
                if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
                state = { url: url || '', objectUrl: null, status: url ? 'done' : 'empty', progress: 0, error: null, pendingFile: null };
                render();
            },
            isUploading() { return state.status === 'uploading'; },
            hasErrors() { return state.status === 'error'; },
            reset() { clear(); },
            destroy() {
                if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
                container.innerHTML = '';
            }
        };
    }

    // ==================== MULTI IMAGE UPLOADER ====================
    // opts: { initialUrls: string[], onChange(urls[]) }
    function createMultiImageUploader(containerId, opts) {
        opts = opts || {};
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`createMultiImageUploader: #${containerId} not found`);

        // items: [{ id, url, objectUrl, status, progress, error, pendingFile, pendingUpload }]
        let items = (opts.initialUrls || []).filter(Boolean).map((url) => makeItem({ url, status: 'done' }));
        let dragSrcId = null;
        let uidCounter = 0;

        function makeItem(partial) {
            return Object.assign({
                id: 'img_' + (++uidCounter) + '_' + Date.now(),
                url: '', objectUrl: null, status: 'empty', progress: 0, error: null, pendingFile: null, pendingUpload: null
            }, partial);
        }

        container.innerHTML = `
            <div class="img-uploader img-uploader--multi">
                <div class="img-uploader__grid"></div>
                <input type="file" accept="${ACCEPTED_TYPES.join(',')}" multiple hidden>
            </div>`;
        const grid = container.querySelector('.img-uploader__grid');
        const fileInput = container.querySelector('input[type="file"]');

        function render() {
            grid.innerHTML = items.map(thumbHtml).join('') + `
                <button type="button" class="img-uploader__add-tile">
                    <span class="img-uploader__pick-icon">+</span> Add Images
                </button>`;
            bindGridEvents();
        }

        function thumbHtml(item) {
            const displaySrc = item.objectUrl || item.url;
            let overlay = '';
            if (item.status === 'uploading') {
                overlay = `
                    <div class="img-uploader__progress-overlay">
                        <div class="img-uploader__spinner"></div>
                        <div class="img-uploader__progress-track"><div class="img-uploader__progress-bar" style="width:${item.progress}%"></div></div>
                    </div>`;
            } else if (item.status === 'error') {
                overlay = `
                    <div class="img-uploader__error-overlay img-uploader__error-overlay--compact">
                        <span>⚠️ ${item.error}</span>
                        <div class="img-uploader__error-actions">
                            <button type="button" class="img-uploader__retry-btn" data-id="${item.id}">Retry</button>
                        </div>
                    </div>`;
            } else if (item.previewFailed) { // done, but the stored URL doesn't actually load
                overlay = `
                    <div class="img-uploader__error-overlay img-uploader__error-overlay--compact">
                        <span>⚠️ Failed to load</span>
                    </div>`;
            }
            return `
                <div class="img-uploader__thumb" draggable="true" data-id="${item.id}">
                    ${displaySrc ? `<img src="${displaySrc}" alt="" data-role="preview-img">` : ''}
                    ${overlay}
                    <button type="button" class="img-uploader__remove-btn img-uploader__remove-btn--thumb" data-id="${item.id}" aria-label="Remove image">✕</button>
                    <span class="img-uploader__drag-handle" title="Drag to reorder">⠿</span>
                </div>`;
        }

        function bindGridEvents() {
            grid.querySelectorAll('.img-uploader__remove-btn').forEach((btn) => {
                btn.addEventListener('click', () => removeItem(btn.dataset.id));
            });
            grid.querySelectorAll('.img-uploader__retry-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const item = items.find((i) => i.id === btn.dataset.id);
                    if (item && item.pendingFile) startUpload(item, item.pendingFile);
                });
            });
            const addTile = grid.querySelector('.img-uploader__add-tile');
            if (addTile) addTile.addEventListener('click', () => fileInput.click());

            // Same load-failure fallback as the single uploader: a URL that
            // was valid at save time can still fail to actually load later.
            grid.querySelectorAll('img[data-role="preview-img"]').forEach((imgEl) => {
                const thumbEl = imgEl.closest('.img-uploader__thumb');
                const item = items.find((i) => i.id === thumbEl?.dataset.id);
                if (!item || item.status !== 'done') return;
                imgEl.addEventListener('error', () => {
                    if (item.previewFailed) return; // avoid a render loop if the same broken URL errors again
                    item.previewFailed = true;
                    render();
                });
            });

            grid.querySelectorAll('.img-uploader__thumb').forEach((el) => {
                el.addEventListener('dragstart', (e) => {
                    dragSrcId = el.dataset.id;
                    e.dataTransfer.effectAllowed = 'move';
                    el.classList.add('img-uploader__thumb--dragging');
                });
                el.addEventListener('dragend', () => el.classList.remove('img-uploader__thumb--dragging'));
                el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('img-uploader__thumb--drop-target'); });
                el.addEventListener('dragleave', () => el.classList.remove('img-uploader__thumb--drop-target'));
                el.addEventListener('drop', (e) => {
                    e.preventDefault();
                    el.classList.remove('img-uploader__thumb--drop-target');
                    const targetId = el.dataset.id;
                    if (!dragSrcId || dragSrcId === targetId) return;
                    reorder(dragSrcId, targetId);
                });
            });
        }

        function reorder(srcId, targetId) {
            const srcIndex = items.findIndex((i) => i.id === srcId);
            const targetIndex = items.findIndex((i) => i.id === targetId);
            if (srcIndex === -1 || targetIndex === -1) return;
            const [moved] = items.splice(srcIndex, 1);
            items.splice(targetIndex, 0, moved);
            render();
            emitChange();
        }

        function removeItem(id) {
            const item = items.find((i) => i.id === id);
            if (item && item.objectUrl) URL.revokeObjectURL(item.objectUrl);
            items = items.filter((i) => i.id !== id);
            render();
            emitChange();
        }

        function emitChange() {
            if (opts.onChange) opts.onChange(items.filter((i) => i.status === 'done').map((i) => i.url));
        }

        function startUpload(item, file) {
            const validationError = validateFile(file);
            if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
            item.objectUrl = URL.createObjectURL(file);
            item.pendingFile = file;

            if (validationError) {
                item.status = 'error';
                item.error = validationError;
                render();
                return;
            }

            item.status = 'uploading';
            item.progress = 0;
            item.error = null;
            render();

            item.pendingUpload = uploadFile(file, (pct) => {
                item.progress = pct;
                const bar = grid.querySelector(`.img-uploader__thumb[data-id="${item.id}"] .img-uploader__progress-bar`);
                if (bar) bar.style.width = pct + '%';
            }).then((url) => {
                item.url = url;
                item.status = 'done';
                item.pendingUpload = null;
                render();
                emitChange();
            }).catch((err) => {
                item.status = 'error';
                item.error = typeof err === 'string' ? err : 'Upload failed';
                item.pendingUpload = null;
                render();
            });
        }

        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files || []);
            files.forEach((file) => {
                const item = makeItem({});
                items.push(item);
                startUpload(item, file);
            });
            render();
            fileInput.value = '';
        });

        render();

        return {
            getValue() {
                return Promise.all(items.map((i) => i.pendingUpload || Promise.resolve()).map((p) => p.catch(() => {})))
                    .then(() => items.filter((i) => i.status === 'done').map((i) => i.url));
            },
            setValue(urls) {
                items.forEach((i) => { if (i.objectUrl) URL.revokeObjectURL(i.objectUrl); });
                items = (urls || []).filter(Boolean).map((url) => makeItem({ url, status: 'done' }));
                render();
            },
            isUploading() { return items.some((i) => i.status === 'uploading'); },
            hasErrors() { return items.some((i) => i.status === 'error'); },
            reset() {
                items.forEach((i) => { if (i.objectUrl) URL.revokeObjectURL(i.objectUrl); });
                items = [];
                render();
            },
            destroy() {
                items.forEach((i) => { if (i.objectUrl) URL.revokeObjectURL(i.objectUrl); });
                container.innerHTML = '';
            }
        };
    }

    window.createSingleImageUploader = createSingleImageUploader;
    window.createMultiImageUploader = createMultiImageUploader;

})();
