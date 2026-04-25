// utils/whatsapp.js — Twilio WhatsApp sender

const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM        = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const ADMIN_WA    = process.env.ADMIN_WHATSAPP;

function getClient() {
    if (!ACCOUNT_SID || !AUTH_TOKEN) return null;
    return twilio(ACCOUNT_SID, AUTH_TOKEN);
}

function toWaNumber(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return `whatsapp:+${digits}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTextMessage(to, message) {
    const client = getClient();
    if (!client) {
        console.warn('WhatsApp: Twilio credentials not configured');
        return { success: false, error: 'Twilio credentials not set' };
    }
    try {
        await client.messages.create({ from: FROM, to: toWaNumber(to), body: message });
        return { success: true };
    } catch (err) {
        console.error('WhatsApp sendTextMessage error:', err.message);
        return { success: false, error: err.message };
    }
}

async function sendOrderConfirmation(to, customerName, orderId, total) {
    const body =
        `مرحباً ${customerName}، تم تأكيد طلبك رقم #${orderId} بنجاح! 🎉\n` +
        `المجموع: ${total} JD\n` +
        `شكراً لتسوقك من PrimeJo 🛍️`;
    return sendTextMessage(to, body);
}

async function notifyAdmin(orderId, customerName, total, customerPhone) {
    if (!ADMIN_WA) {
        console.warn('WhatsApp: ADMIN_WHATSAPP not configured');
        return { success: false, error: 'ADMIN_WHATSAPP not set' };
    }
    const client = getClient();
    if (!client) return { success: false, error: 'Twilio credentials not set' };

    const body =
        `🛒 طلب جديد على PrimeJo!\n` +
        `رقم الطلب: #${orderId}\n` +
        `العميل: ${customerName}\n` +
        `الهاتف: ${customerPhone}\n` +
        `المجموع: ${total} JD`;
    try {
        await client.messages.create({ from: FROM, to: ADMIN_WA, body });
        return { success: true };
    } catch (err) {
        console.error('WhatsApp notifyAdmin error:', err.message);
        return { success: false, error: err.message };
    }
}

async function broadcastMessage(numbersArray, message) {
    const client = getClient();
    if (!client) return { sent: 0, failed: numbersArray.length, errors: ['Twilio credentials not set'] };

    let sent = 0, failed = 0;
    const errors = [];

    for (const num of numbersArray) {
        try {
            await client.messages.create({ from: FROM, to: toWaNumber(num), body: message });
            sent++;
        } catch (err) {
            failed++;
            errors.push({ phone: num, error: err.message });
        }
        await sleep(500);
    }

    return { sent, failed, errors };
}

module.exports = { sendTextMessage, sendOrderConfirmation, notifyAdmin, broadcastMessage };
