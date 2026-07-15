// routes/payments.js — Stripe payment intent creation
// Requires: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env

const express = require('express');
const { getStoreInfo } = require('../utils/storeInfo');
const router  = express.Router();

let stripe;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
} catch (e) {
    console.warn('⚠️  Stripe not installed. Run: npm install stripe');
}

// ── POST /api/payments/create-intent ─────────────────────────────────────────
// Called by mobile app before showing payment sheet
router.post('/create-intent', async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ success: false, error: 'Payment processing not configured' });
    }
    try {
        const { amount, currency = 'jod', customer_email, customer_name, metadata = {} } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ success: false, error: 'Valid amount is required' });

        // Stripe requires amount in smallest currency unit (fils for JOD = * 1000)
        // JOD is a 3-decimal currency — 1 JOD = 1000 fils
        const amountInSmallestUnit = Math.round(parseFloat(amount) * 1000);

        const { name: storeName } = await getStoreInfo();

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSmallestUnit,
            currency: currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            receipt_email: customer_email || undefined,
            description: `${storeName} Order — ${customer_name || 'Customer'}`,
            metadata: {
                ...metadata,
                // Internal analytics tag, deliberately left keyed on the env var
                // rather than the admin-editable brand name so dashboards/reports
                // stay stable across a rebrand.
                source: `${(process.env.STORE_NAME || 'store').toLowerCase()}-mobile`,
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Stripe sends events here. Register URL in Stripe dashboard.
// Requires raw body — add before express.json() in server.js for this route
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ success: false, error: 'Webhook not configured' });
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
    }

    try {
        const pool = require('../db');
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            await pool.query(
                `UPDATE orders SET payment_status = 'paid', order_status = 'confirmed'
                 WHERE payment_intent_id = ?`,
                [pi.id]
            );
            console.log(`✅ Payment succeeded for intent: ${pi.id}`);
        } else if (event.type === 'payment_intent.payment_failed') {
            const pi = event.data.object;
            await pool.query(
                `UPDATE orders SET payment_status = 'failed' WHERE payment_intent_id = ?`,
                [pi.id]
            );
        }
    } catch (dbErr) {
        console.error('Webhook DB error:', dbErr.message);
    }

    res.json({ received: true });
});

module.exports = router;
