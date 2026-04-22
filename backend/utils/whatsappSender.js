// utils/whatsappSender.js
// Sends a single WhatsApp message via Meta Cloud API

const https = require('https');

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN           = process.env.WHATSAPP_TOKEN;

/**
 * Send a free-text WhatsApp message.
 * @param {string} to      — recipient phone in international format (e.g. 962XXXXXXXXX)
 * @param {string} body    — message text
 * @returns {Promise<{success:boolean, error?:string}>}
 */
function sendTextMessage(to, body) {
    return new Promise((resolve) => {
        if (!PHONE_NUMBER_ID || !TOKEN) {
            return resolve({ success: false, error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set' });
        }

        const payload = JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body }
        });

        const options = {
            hostname: 'graph.facebook.com',
            path:     `/v19.0/${PHONE_NUMBER_ID}/messages`,
            method:   'POST',
            headers:  {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 200 && json.messages) {
                        resolve({ success: true });
                    } else {
                        const errMsg = json.error?.message || JSON.stringify(json);
                        resolve({ success: false, error: errMsg });
                    }
                } catch (e) {
                    resolve({ success: false, error: data });
                }
            });
        });

        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(payload);
        req.end();
    });
}

/**
 * Send a template WhatsApp message.
 * @param {string} to           — recipient phone
 * @param {string} templateName — approved template name
 * @param {string} langCode     — language code, default 'ar'
 * @returns {Promise<{success:boolean, error?:string}>}
 */
function sendTemplateMessage(to, templateName, langCode = 'ar') {
    return new Promise((resolve) => {
        if (!PHONE_NUMBER_ID || !TOKEN) {
            return resolve({ success: false, error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set' });
        }

        const payload = JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name:     templateName,
                language: { code: langCode }
            }
        });

        const options = {
            hostname: 'graph.facebook.com',
            path:     `/v19.0/${PHONE_NUMBER_ID}/messages`,
            method:   'POST',
            headers:  {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 200 && json.messages) {
                        resolve({ success: true });
                    } else {
                        const errMsg = json.error?.message || JSON.stringify(json);
                        resolve({ success: false, error: errMsg });
                    }
                } catch (e) {
                    resolve({ success: false, error: data });
                }
            });
        });

        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(payload);
        req.end();
    });
}

/** Simple delay helper for rate limiting */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sendTextMessage, sendTemplateMessage, sleep };
