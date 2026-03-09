import { useState } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeService } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodManagerProps {
  customerId: string;
  onUpdate: () => void;
}

export function PaymentMethodManager({ customerId, onUpdate }: PaymentMethodManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleAddPaymentMethod = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement
      });

      if (error) throw error;

      await stripeService.updatePaymentMethod(customerId, paymentMethod!.id);

      toast({
        title: 'Success',
        description: 'Payment method added successfully'
      });

      setShowAddCard(false);
      onUpdate();
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button
          size="sm"
          onClick={() => setShowAddCard(!showAddCard)}
          variant={showAddCard ? 'outline' : 'default'}
        >
          <Plus className="h-4 w-4 mr-1" />
          {showAddCard ? 'Cancel' : 'Add Card'}
        </Button>
      </div>

      {showAddCard && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': { color: '#aab7c4' }
                    }
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAddPaymentMethod}
              disabled={loading || !stripe}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
