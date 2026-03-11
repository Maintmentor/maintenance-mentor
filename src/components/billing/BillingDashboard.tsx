import { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceList } from './InvoiceList';
import { PaymentMethodManager } from './PaymentMethodManager';
import { BillingAddressForm } from './BillingAddressForm';
import { stripeService } from '@/services/stripeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/services/stripeService';

export function BillingDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentFailures, setPaymentFailures] = useState<any[]>([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [invoicesData, failuresData] = await Promise.all([
        stripeService.getInvoices(user.id),
        stripeService.getPaymentFailures(user.id)
      ]);

      setInvoices(invoicesData || []);
      setPaymentFailures(failuresData || []);

      if (profile?.stripe_customer_id) {
        try {
          const { invoice } = await stripeService.getUpcomingInvoice(profile.stripe_customer_id);
          setUpcomingInvoice(invoice);
        } catch (error) {
          console.log('No upcoming invoice');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (invoiceId: string) => {
    try {
      await stripeService.retryPayment(invoiceId);
      toast({
        title: 'Success',
        description: 'Payment retry initiated'
      });
      loadBillingData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading billing information...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and view invoice history
        </p>
      </div>

      {paymentFailures.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You have {paymentFailures.length} failed payment(s) that need attention.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRetryPayment(paymentFailures[0].stripe_invoice_id)}
            >
              Retry Payment
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {upcomingInvoice && (
        <Card className="p-6 mb-6 bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Upcoming Charge</h3>
                <p className="text-sm text-muted-foreground">
                  Next billing date: {new Date(upcomingInvoice.period_end * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatAmount(upcomingInvoice.amount_due)}</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Invoice History</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
          <TabsTrigger value="address">Billing Address</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoiceList invoices={invoices} />
        </TabsContent>

        <TabsContent value="payment">
          <Elements stripe={getStripe()}>
            <PaymentMethodManager
              customerId={profile?.stripe_customer_id || ''}
              onUpdate={loadBillingData}
            />
          </Elements>
        </TabsContent>

        <TabsContent value="address">
          <BillingAddressForm
            customerId={profile?.stripe_customer_id || ''}
            onUpdate={loadBillingData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
