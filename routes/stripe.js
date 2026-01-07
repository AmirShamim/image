const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Initialize Stripe (only if configured)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Price ID mapping
const PRICE_IDS = {
    pro: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE,
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE
    },
    business: {
        monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE,
        yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE
    }
};

// Check if Stripe is configured
const isStripeConfigured = () => {
    return stripe && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET;
};

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Payment system not configured' });
    }

    try {
        const { planName, billingCycle } = req.body;
        const userId = req.user.userId;

        // Validate plan
        if (!['pro', 'business'].includes(planName)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return res.status(400).json({ error: 'Invalid billing cycle' });
        }

        // Get price ID
        const priceId = PRICE_IDS[planName]?.[billingCycle];
        if (!priceId) {
            return res.status(400).json({ error: 'Price not configured for this plan' });
        }

        // Get user
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create or get Stripe customer
        let customerId = user.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = customer.id;
            db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, userId);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?canceled=true`,
            metadata: {
                userId: user.id,
                planName,
                billingCycle
            }
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Payment system not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const { userId, planName } = session.metadata;

            // Update user subscription
            if (userId && planName) {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const expiresAt = new Date(subscription.current_period_end * 1000);

                db.prepare(`
                    UPDATE users 
                    SET subscription_tier = ?, subscription_expires = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `).run(planName, expiresAt.toISOString(), userId);

                console.log(`User ${userId} upgraded to ${planName} until ${expiresAt}`);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Find user by Stripe customer ID
            const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
            if (user) {
                const expiresAt = new Date(subscription.current_period_end * 1000);
                const status = subscription.status;

                if (status === 'active') {
                    db.prepare(`
                        UPDATE users SET subscription_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    `).run(expiresAt.toISOString(), user.id);
                }
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Downgrade user to free
            const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
            if (user) {
                db.prepare(`
                    UPDATE users 
                    SET subscription_tier = 'free', subscription_expires = NULL, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `).run(user.id);
                console.log(`User ${user.id} subscription canceled, downgraded to free`);
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.error('Payment failed for customer:', invoice.customer);
            // Optionally send email notification
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// Get customer portal link
router.post('/create-portal-session', authenticateToken, async (req, res) => {
    if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Payment system not configured' });
    }

    try {
        const userId = req.user.userId;
        const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(userId);

        if (!user?.stripe_customer_id) {
            return res.status(400).json({ error: 'No subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: process.env.FRONTEND_URL || 'http://localhost:5173'
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Portal session error:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

// Get subscription status
router.get('/subscription', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.prepare(`
            SELECT subscription_tier, subscription_expires, stripe_customer_id 
            FROM users WHERE id = ?
        `).get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            tier: user.subscription_tier || 'free',
            expires: user.subscription_expires,
            hasStripeAccount: !!user.stripe_customer_id
        });
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
