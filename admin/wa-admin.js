// ============================================================
//  WHATSAPP CONTACTS & BROADCAST — Admin JS
// ============================================================

function toggleWaCustomCategory() {
    const cat = document.getElementById('waImportCategory').value;
    const grp = document.getElementById('waCustomCategoryGroup');
    if (grp) grp.style.display = cat === 'Custom' ? '' : 'none';
}

async function importWaContacts() {
    const category       = document.getElementById('waImportCategory')?.value;
    const customCategory = document.getElementById('waCustomCategoryInput')?.value?.trim();
    const fileInput      = document.getElementById('waImportFile');
    const resultEl       = document.getElementById('waImportResult');

    if (!fileInput?.files?.length) { alert('Please select an Excel file'); return; }
    if (category === 'Custom' && !customCategory) { alert('Enter a custom category name'); return; }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('category', category);
    if (customCategory) formData.append('custom_category', customCategory);

    if (resultEl) resultEl.innerHTML = '<span style="color:#888;">Uploading...</span>';

    try {
        const token = localStorage.getItem('adminToken');
        const res   = await fetch(`${API_BASE}/whatsapp-contacts/import`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            if (resultEl) resultEl.innerHTML =
                '<span style="color:#27ae60;">Inserted: <b>' + data.inserted + '</b> &nbsp; Skipped: <b>' + data.skipped + '</b></span>';
            fileInput.value = '';
            loadWaContacts();
        } else {
            if (resultEl) resultEl.innerHTML = '<span style="color:#e74c3c;">Error: ' + data.error + '</span>';
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = '<span style="color:#e74c3c;">Request failed: ' + err.message + '</span>';
    }
}

async function loadWaContacts() {
    const filter  = document.getElementById('waContactsFilter')?.value || '';
    const tbody   = document.getElementById('waContactsTableBody');
    const countEl = document.getElementById('waContactsCount');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#aaa;">Loading...</td></tr>';

    try {
        const token = localStorage.getItem('adminToken');
        const url   = API_BASE + '/whatsapp-contacts' + (filter ? '?category=' + encodeURIComponent(filter) : '');
        const res   = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
        const data  = await res.json();

        if (!data.success) throw new Error(data.error);
        const contacts = data.contacts || [];
        if (countEl) countEl.textContent = contacts.length + ' contacts';

        if (!contacts.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#aaa;">No contacts found</td></tr>';
            return;
        }

        tbody.innerHTML = contacts.map(function(c, i) {
            var catLabel = c.category === 'Custom' ? (c.custom_category || 'Custom') : c.category;
            var color    = waCatColor(c.category);
            var date     = new Date(c.created_at).toLocaleDateString();
            return '<tr>' +
                '<td>' + (i + 1) + '</td>' +
                '<td>' + (c.name || '-') + '</td>' +
                '<td style="font-family:monospace;">' + c.phone + '</td>' +
                '<td><span style="background:' + color + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:0.75rem;">' + catLabel + '</span></td>' +
                '<td style="color:#888;font-size:0.8rem;">' + date + '</td>' +
                '<td><button onclick="deleteWaContact(' + c.id + ')" style="background:#e74c3c;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.78rem;">Delete</button></td>' +
                '</tr>';
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#e74c3c;text-align:center;padding:1rem;">Error: ' + err.message + '</td></tr>';
    }
}

function waCatColor(cat) {
    var map = { VIP: '#9b59b6', Normal: '#3498db', New: '#27ae60', Inactive: '#95a5a6', Custom: '#e67e22' };
    return map[cat] || '#555';
}

async function deleteWaContact(id) {
    if (!confirm('Delete this contact?')) return;
    try {
        const token = localStorage.getItem('adminToken');
        await fetch(API_BASE + '/whatsapp-contacts/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        loadWaContacts();
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

// ── Broadcast ──────────────────────────────────────────────

function toggleWaBroadcastTemplate() {
    var on      = document.getElementById('waBroadcastTemplateToggle')?.checked;
    var textGrp = document.getElementById('waBroadcastTextGroup');
    var tplGrp  = document.getElementById('waBroadcastTemplateGroup');
    if (textGrp) textGrp.style.display = on ? 'none' : '';
    if (tplGrp)  tplGrp.style.display  = on ? ''     : 'none';
}

async function loadWaBroadcastCount() {
    var cat   = document.getElementById('waBroadcastCategory')?.value;
    var label = document.getElementById('waBroadcastCountLabel');
    if (!label || !cat) return;
    try {
        const token = localStorage.getItem('adminToken');
        const res   = await fetch(API_BASE + '/whatsapp/contact-count?category=' + encodeURIComponent(cat), {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        label.textContent = data.success ? data.total + ' contacts in this category' : '';
    } catch (_) {
        label.textContent = '';
    }
}

async function sendWaBroadcast() {
    var category      = document.getElementById('waBroadcastCategory')?.value;
    var templateMode  = document.getElementById('waBroadcastTemplateToggle')?.checked;
    var message       = document.getElementById('waBroadcastMessage')?.value?.trim();
    var templateName  = document.getElementById('waBroadcastTemplateName')?.value?.trim();
    var langCode      = document.getElementById('waBroadcastLangCode')?.value?.trim() || 'ar';
    var btn           = document.getElementById('waBroadcastBtn');
    var resultEl      = document.getElementById('waBroadcastResult');
    var progressWrap  = document.getElementById('waBroadcastProgress');
    var progressBar   = document.getElementById('waBroadcastBar');
    var progressLabel = document.getElementById('waBroadcastProgressLabel');

    if (!category) { alert('Select a category'); return; }
    if (!templateMode && !message) { alert('Enter a message'); return; }
    if (templateMode && !templateName) { alert('Enter template name'); return; }
    if (!confirm('Send broadcast to all contacts in "' + category + '"? This cannot be undone.')) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    if (progressWrap) progressWrap.style.display = '';
    if (progressBar) progressBar.style.width = '30%';
    if (progressLabel) progressLabel.textContent = 'Sending... (this may take a while for large lists)';
    if (resultEl) resultEl.innerHTML = '<span style="color:#888;">Sending broadcast...</span>';

    try {
        const token = localStorage.getItem('adminToken');
        const res   = await fetch(API_BASE + '/whatsapp/broadcast', {
            method:  'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                category: category,
                template_mode: templateMode,
                template_name: templateName,
                lang_code: langCode
            })
        });
        const data = await res.json();

        if (progressBar) progressBar.style.width = '100%';
        if (progressLabel) progressLabel.textContent = 'Done!';

        if (data.success) {
            var errorLines = (data.errors || []).slice(0, 5).map(function(e) {
                return '<li style="color:#e74c3c;font-size:0.8rem;">' + e.phone + ': ' + e.error + '</li>';
            }).join('');
            if (resultEl) resultEl.innerHTML =
                '<div style="margin-bottom:0.75rem;">' +
                '<span style="color:#27ae60;font-size:1.1rem;font-weight:700;">Sent: ' + data.sent + '</span>' +
                '&nbsp;&nbsp;' +
                '<span style="color:#e74c3c;font-size:1.1rem;font-weight:700;">Failed: ' + data.failed + '</span>' +
                '&nbsp;&nbsp;' +
                '<span style="color:#888;font-size:0.85rem;">Total: ' + data.total + '</span>' +
                '</div>' +
                (errorLines ? '<ul style="list-style:none;padding:0;margin:0;">' + errorLines + '</ul>' : '') +
                (data.errors && data.errors.length > 5 ? '<p style="color:#888;font-size:0.78rem;">...and ' + (data.errors.length - 5) + ' more errors</p>' : '');
        } else {
            if (resultEl) resultEl.innerHTML = '<span style="color:#e74c3c;">Error: ' + data.error + '</span>';
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = '<span style="color:#e74c3c;">Request failed: ' + err.message + '</span>';
        if (progressLabel) progressLabel.textContent = 'Failed';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Send Broadcast'; }
        setTimeout(function() { if (progressWrap) progressWrap.style.display = 'none'; }, 3000);
    }
}
