const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// Create a subscription
router.post('/create-subscription', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can subscribe' });
        }

        const { plan } = req.body;
        if (!['basic', 'pro'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const planId = plan === 'pro' ? process.env.RAZORPAY_PRO_PLAN_ID : process.env.RAZORPAY_BASIC_PLAN_ID;
        if (!planId) {
            return res.status(500).json({ error: 'Razorpay Plan ID not configured on server' });
        }

        const user = await User.findById(req.user.userId);
        let customerId = user.razorpayCustomerId;

        // Ensure user is a Razorpay customer
        if (!customerId) {
            const customer = await razorpay.customers.create({
                name: user.username,
                email: `${user.username}@example.com`, // Adjust if you store actual emails
                notes: {
                    userId: user._id.toString()
                }
            });
            customerId = customer.id;
            user.razorpayCustomerId = customerId;
            await user.save();
        }

        // Create the subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_id: customerId,
            total_count: 12, // For example, 1 year if billed monthly
            customer_notify: 1,
            notes: {
                userId: user._id.toString(),
                plan: plan
            }
        });

        res.json({
            subscriptionId: subscription.id,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Razorpay Create Subscription Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify payment signature
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = req.body;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Valid signature, update DB locally without waiting for webhook
            const user = await User.findById(req.user.userId);

            user.razorpaySubscriptionId = razorpay_subscription_id;
            if (plan) {
                user.subscriptionTier = plan;
                user.subscriptionStatus = 'active';
            }
            await user.save();

            return res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Webhook to handle Razorpay events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const endpointSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Express raw middleware returns Buffer for req.body here
    const bodyStr = req.body.toString('utf8');

    const expectedSignature = crypto
        .createHmac('sha256', endpointSecret || '')
        .update(bodyStr)
        .digest('hex');

    if (expectedSignature !== signature) {
        return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(bodyStr);

    try {
        if (event.event === 'subscription.activated' || event.event === 'subscription.charged') {
            const subscription = event.payload.subscription.entity;
            const customerId = subscription.customer_id;
            const plan = subscription.notes.plan || 'pro'; // default to pro if missing

            const user = await User.findOne({ razorpayCustomerId: customerId });
            if (user) {
                user.subscriptionStatus = 'active';
                user.subscriptionTier = plan;
                user.razorpaySubscriptionId = subscription.id;
                await user.save();
            }
        }
        else if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
            const subscription = event.payload.subscription.entity;
            const customerId = subscription.customer_id;

            const user = await User.findOne({ razorpayCustomerId: customerId });
            if (user) {
                user.subscriptionStatus = 'canceled';
                user.subscriptionTier = 'free';
                await user.save();
            }
        }
    } catch (err) {
        console.error('Webhook processing error:', err);
    }

    res.json({ status: 'ok' });
});

module.exports = router;
