import { FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
      open: { label: 'Open', variant: 'secondary', icon: Clock },
      void: { label: 'Void', variant: 'outline', icon: XCircle },
      uncollectible: { label: 'Uncollectible', variant: 'destructive', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">
                    {invoice.description || 'Subscription Payment'}
                  </h4>
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Invoice #{invoice.stripe_invoice_id.slice(-8)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {formatDate(invoice.created_at)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatAmount(invoice.amount_paid, invoice.currency)}
              </p>
              <div className="flex gap-2 mt-2">
                {invoice.invoice_pdf && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                )}
                {invoice.hosted_invoice_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                  >
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
      {invoices.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
        </Card>
      )}
    </div>
  );
}
