# Stripe Payment Integration Setup Guide

## Overview
This application includes a complete Stripe subscription payment system with:
- Multiple pricing tiers (Basic, Standard, Premium)
- Free 7-day trial for all new users
- Automatic trial-to-paid conversion
- Subscription management dashboard
- Webhook handling for payment events

## Setup Instructions

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business profile setup

### 2. Get API Keys
1. Navigate to **Developers > API keys** in Stripe Dashboard
2. Copy your **Publishable key** and **Secret key**
3. For testing, use the test mode keys (they start with `pk_test_` and `sk_test_`)

### 3. Configure Environment Variables

#### Frontend (.env file)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

#### Backend (Supabase Edge Functions)
The following secrets are already configured in Supabase:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 4. Create Products and Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Create three products with monthly recurring prices:

**Basic Plan**
- Name: Basic
- Price: $25/month
- Price ID: Copy this (e.g., `price_xxxxx`)

**Standard Plan**
- Name: Standard
- Price: $50/month
- Price ID: Copy this

**Premium Plan**
- Name: Premium
- Price: $100/month
- Price ID: Copy this

3. Update the price IDs in `src/components/subscription/PricingTiers.tsx`:
```typescript
export const pricingTiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceId: 'price_YOUR_BASIC_PRICE_ID', // Update this
    price: 25,
    ...
  },
  // Update other tiers similarly
];
```

### 5. Configure Webhooks

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook-handler
   ```
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration

#### Test Cards
Use these test card numbers in test mode:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Use any future expiration date and any 3-digit CVC.

#### Testing Flow
1. Register a new account (gets 7-day free trial)
2. Navigate to Profile > Subscription tab
3. Select a pricing tier
4. Enter test card details
5. Complete payment
6. Verify subscription status updates to "active"

## Features Implemented

### 1. Free Trial System
- All new users get 7-day free trial automatically
- Trial status displayed in banner at top of app
- Trial expiration tracking and notifications

### 2. Pricing Tiers
- **Basic**: $25/month - 1-50 beds
- **Standard**: $50/month - 51-100 beds (Most Popular)
- **Premium**: $100/month - 101-200 beds

### 3. Subscription Management
- View current subscription status
- See next billing date
- Cancel subscription
- Upgrade/downgrade plans

### 4. Payment Processing
- Secure payment with Stripe Elements
- PCI compliant (no card data touches your servers)
- Support for all major credit cards
- 3D Secure authentication support

### 5. Webhook Automation
- Automatic subscription status updates
- Handle payment failures
- Process subscription cancellations
- Update user access based on payment status

## Database Schema

The following columns were added to the `profiles` table:
- `stripe_customer_id` - Links user to Stripe customer
- `stripe_subscription_id` - Current subscription ID
- `subscription_price_id` - Selected price tier
- `subscription_status` - Current status (trial, active, canceled, expired, past_due)
- `subscription_tier` - Plan tier (basic, standard, premium)
- `trial_ends_at` - Trial expiration date

## Security Notes

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` in Supabase secrets only
2. **Verify webhooks** - Always verify webhook signatures to prevent fraud
3. **Use HTTPS** - Stripe requires HTTPS for webhooks in production
4. **Test thoroughly** - Use test mode before going live

## Troubleshooting

### Payment fails silently
- Check browser console for errors
- Verify Stripe publishable key is correct
- Ensure Stripe.js is loading properly

### Webhook not receiving events
- Verify webhook URL is correct and accessible
- Check webhook signing secret is configured
- Review Stripe webhook logs in dashboard

### Subscription status not updating
- Check Supabase edge function logs
- Verify webhook handler is processing events
- Ensure database permissions allow updates

## Going Live

1. Switch to live mode in Stripe Dashboard
2. Update API keys to live keys (remove `_test_`)
3. Update webhook endpoint to production URL
4. Test with real card (small amount)
5. Monitor for first few transactions

## Support

For issues with:
- **Stripe Integration**: Check [Stripe Docs](https://stripe.com/docs)
- **Supabase Functions**: Check [Supabase Docs](https://supabase.com/docs)
- **Application Issues**: Review application logs
