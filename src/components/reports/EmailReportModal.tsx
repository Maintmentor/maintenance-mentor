import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail, Calendar, Users } from 'lucide-react';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
  onSendEmail: (emailData: any) => Promise<void>;
}

export default function EmailReportModal({ 
  isOpen, 
  onClose, 
  reportData, 
  onSendEmail 
}: EmailReportModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState('user');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const recipientTypes = [
    { value: 'user', label: 'Personal Copy', icon: Users },
    { value: 'mechanic', label: 'Mechanic/Service Provider', icon: Users },
    { value: 'insurance', label: 'Insurance Company', icon: Users },
    { value: 'service_provider', label: 'Service Provider', icon: Users }
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Error',
        description: 'Please enter recipient email',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSendEmail({
        recipientEmail,
        recipientName,
        recipientType,
        customMessage
      });

      if (scheduleDelivery) {
        const nextSendDate = new Date();
        switch (frequency) {
          case 'weekly':
            nextSendDate.setDate(nextSendDate.getDate() + 7);
            break;
          case 'monthly':
            nextSendDate.setMonth(nextSendDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextSendDate.setMonth(nextSendDate.getMonth() + 3);
            break;
          case 'yearly':
            nextSendDate.setFullYear(nextSendDate.getFullYear() + 1);
            break;
        }

        const { error } = await supabase
          .from('email_schedules')
          .insert({
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            recipient_type: recipientType,
            frequency,
            next_send_date: nextSendDate.toISOString()
          });

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Email sent and delivery scheduled!'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Report sent successfully!'
        });
      }

      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <Label htmlFor="name">Recipient Name (Optional)</Label>
            <Input
              id="name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label>Recipient Type</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipientTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label>Schedule Regular Delivery</Label>
            </div>
            <Switch
              checked={scheduleDelivery}
              onCheckedChange={setScheduleDelivery}
            />
          </div>

          {scheduleDelivery && (
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendEmail}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Report'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}