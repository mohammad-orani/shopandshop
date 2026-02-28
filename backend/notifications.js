// ==================== NOTIFICATIONS SERVICE ====================
// CallMeBot (WhatsApp) + SendGrid (Email)
// Add to your backend folder and require in server.js

const https = require('https');

// ==================== CONFIG ====================
// Add these to your Railway environment variables:
// CALLMEBOT_APIKEY   = your CallMeBot API key
// SENDGRID_API_KEY   = your SendGrid API key
// SENDGRID_FROM      = your verified sender email (e.g. orders@primejo.store)
// STORE_NAME         = Primejo

const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM    = process.env.SENDGRID_FROM    || 'orders@primejo.store';
const STORE_NAME       = process.env.STORE_NAME       || 'Primejo';

// ==================== STATUS MESSAGES ====================

const statusMessages = {
    pending: {
        en: `✅ Your order has been received and is pending confirmation.`,
        ar: `✅ تم استلام طلبك وهو بانتظار التأكيد.`
    },
    processing: {
        en: `⚙️ Great news! Your order is now being processed and prepared.`,
        ar: `⚙️ خبر رائع! طلبك قيد المعالجة والتحضير الآن.`
    },
    shipped: {
        en: `🚚 Your order is on its way! It has been shipped and will arrive soon.`,
        ar: `🚚 طلبك في الطريق إليك! تم شحنه وسيصل قريباً.`
    },
    delivered: {
        en: `🎉 Your order has been delivered successfully. Thank you for shopping with us!`,
        ar: `🎉 تم تسليم طلبك بنجاح. شكراً لتسوقك معنا!`
    },
    cancelled: {
        en: `❌ Your order has been cancelled. Please contact us if you have any questions.`,
        ar: `❌ تم إلغاء طلبك. يرجى التواصل معنا إذا كان لديك أي استفسار.`
    }
};

function buildMessage(order, newStatus) {
    const lang = order.language || 'ar';
    const statusMsg = statusMessages[newStatus]?.[lang] || statusMessages[newStatus]?.en || `Status updated to: ${newStatus}`;
    const orderId = order.order_id || order.id;
    const name = order.customer_name || '';
    const total = parseFloat(order.total || 0).toFixed(2);
    const currency = order.currency || 'JOD';

    if (lang === 'ar') {
        return `مرحباً ${name} 👋\n\nتحديث طلبك من ${STORE_NAME}:\nرقم الطلب: ${orderId}\n\n${statusMsg}\n\nالإجمالي: ${total} ${currency}\n\nشكراً لتسوقك معنا 🛍️`;
    }
    return `Hello ${name} 👋\n\nOrder update from ${STORE_NAME}:\nOrder ID: ${orderId}\n\n${statusMsg}\n\nTotal: ${currency} ${total}\n\nThank you for shopping with us 🛍️`;
}

// ==================== WHATSAPP via CALLMEBOT ====================

async function sendWhatsApp(phone, message) {
    if (!CALLMEBOT_APIKEY) {
        console.warn('⚠️ CALLMEBOT_APIKEY not set — skipping WhatsApp');
        return { success: false, error: 'API key not configured' };
    }

    // Clean phone number — remove + and spaces
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMsg}&apikey=${CALLMEBOT_APIKEY}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📱 WhatsApp sent to ${cleanPhone}: ${res.statusCode}`);
                resolve({ success: res.statusCode === 200, response: data });
            });
        }).on('error', (err) => {
            console.error('WhatsApp error:', err.message);
            resolve({ success: false, error: err.message });
        });
    });
}

// ==================== EMAIL via SENDGRID ====================

async function sendEmail(toEmail, subject, message, order) {
    if (!SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY not set — skipping email');
        return { success: false, error: 'API key not configured' };
    }

    const lang = order.language || 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const orderId = order.order_id || order.id;

    const htmlBody = `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${lang}">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: #1a1a1a; padding: 24px; text-align: center;">
                <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 2px;">${STORE_NAME}</h1>
            </div>
            <!-- Body -->
            <div style="padding: 30px; text-align: ${lang === 'ar' ? 'right' : 'left'};">
                <p style="font-size: 16px; color: #333; line-height: 1.7; white-space: pre-line;">${message}</p>
                <div style="background: #f8f8f8; border-right: 4px solid #d4af37; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        ${lang === 'ar' ? 'رقم الطلب' : 'Order ID'}
                    </strong><br>
                    <span style="font-size: 18px; font-weight: 900; color: #1a1a1a; font-family: monospace;">${orderId}</span>
                </div>
            </div>
            <!-- Footer -->
            <div style="background: #f8f8f8; padding: 16px; text-align: center; border-top: 1px solid #e8e8e8;">
                <p style="color: #aaa; font-size: 12px; margin: 0;">&copy; 2026 ${STORE_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const payload = JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: SENDGRID_FROM, name: STORE_NAME },
        subject: subject,
        content: [
            { type: 'text/plain', value: message },
            { type: 'text/html',  value: htmlBody }
        ]
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.sendgrid.com',
            path: '/v3/mail/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const ok = res.statusCode >= 200 && res.statusCode < 300;
                console.log(`📧 Email sent to ${toEmail}: ${res.statusCode}`);
                resolve({ success: ok, statusCode: res.statusCode });
            });
        });

        req.on('error', (err) => {
            console.error('Email error:', err.message);
            resolve({ success: false, error: err.message });
        });

        req.write(payload);
        req.end();
    });
}

// ==================== MAIN NOTIFY FUNCTION ====================

async function notifyOrderStatusChange(order, newStatus) {
    if (!order || !newStatus) return;

    const method = order.notification_method || 'none';
    if (method === 'none') return;

    const message = buildMessage(order, newStatus);
    const lang = order.language || 'ar';
    const subject = lang === 'ar'
        ? `تحديث طلبك - ${order.order_id || order.id}`
        : `Order Update - ${order.order_id || order.id}`;

    const results = {};

    // WhatsApp
    if ((method === 'whatsapp' || method === 'both') && order.customer_phone) {
        results.whatsapp = await sendWhatsApp(order.customer_phone, message);
    }

    // Email
    if ((method === 'email' || method === 'both') && order.notification_email) {
        results.email = await sendEmail(order.notification_email, subject, message, order);
    }

    console.log(`🔔 Notifications for order ${order.order_id}:`, JSON.stringify(results));
    return results;
}

module.exports = { notifyOrderStatusChange };
