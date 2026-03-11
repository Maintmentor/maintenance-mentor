import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export const stripeService = {
  async createPaymentIntent(amount: number, userId: string) {
    const { data, error } = await supabase.functions.invoke('stripe-payment-handler', {
      body: { action: 'create-payment-intent', amount, userId }
    });

    if (error) throw error;
    return data;
  },

  async createSubscription(userId: string, priceId: string, email: string) {
    const { data, error } = await supabase.functions.invoke('stripe-payment-handler', {
      body: { action: 'create-subscription', userId, priceId, email }
    });

    if (error) throw error;
    return data;
  },

  async cancelSubscription(subscriptionId: string) {
    const { data, error } = await supabase.functions.invoke('stripe-payment-handler', {
      body: { action: 'cancel-subscription', subscriptionId }
    });

    if (error) throw error;
    return data;
  },

  async getSubscription(subscriptionId: string) {
    const { data, error } = await supabase.functions.invoke('stripe-payment-handler', {
      body: { action: 'get-subscription', subscriptionId }
    });

    if (error) throw error;
    return data;
  },

  async updatePaymentMethod(customerId: string, paymentMethodId: string) {
    const { data, error } = await supabase.functions.invoke('billing-manager', {
      body: { action: 'updatePaymentMethod', customerId, paymentMethodId }
    });

    if (error) throw error;
    return data;
  },

  async updateBillingAddress(customerId: string, addressData: any) {
    const { data, error } = await supabase.functions.invoke('billing-manager', {
      body: { action: 'updateBillingAddress', customerId, addressData }
    });

    if (error) throw error;
    return data;
  },

  async getUpcomingInvoice(customerId: string) {
    const { data, error } = await supabase.functions.invoke('billing-manager', {
      body: { action: 'getUpcomingInvoice', customerId }
    });

    if (error) throw error;
    return data;
  },

  async retryPayment(invoiceId: string) {
    const { data, error } = await supabase.functions.invoke('billing-manager', {
      body: { action: 'retryPayment', invoiceId }
    });

    if (error) throw error;
    return data;
  },

  async getPaymentMethods(customerId: string) {
    const { data, error } = await supabase.functions.invoke('billing-manager', {
      body: { action: 'getPaymentMethods', customerId }
    });

    if (error) throw error;
    return data;
  },

  async getInvoices(userId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPaymentFailures(userId: string) {
    const { data, error } = await supabase
      .from('payment_failures')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

