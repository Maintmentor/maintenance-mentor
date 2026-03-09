import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Clock, CheckCircle, XCircle, Download } from 'lucide-react';

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  inquiry_type: string;
  message: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export const SupportTicketManager: React.FC = () => {
  const [tickets, setTickets] = useState<ContactInquiry[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ContactInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch support tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contact_inquiries')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ticket status updated'
      });

      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket',
        variant: 'destructive'
      });
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notes saved successfully'
      });

      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive'
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Type', 'Status', 'Message'];
    const rows = filteredTickets.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.name,
      t.email,
      t.inquiry_type,
      t.status,
      t.message
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support-tickets-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: 'default',
      in_progress: 'secondary',
      resolved: 'outline'
    };
    return variants[status] || 'default';
  };

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'new').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="text-sm">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{ticket.name}</TableCell>
                  <TableCell>{ticket.email}</TableCell>
                  <TableCell className="text-sm">{ticket.inquiry_type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setAdminNotes(ticket.admin_notes || '');
                        }}
                      >
                        View
                      </Button>
                      <Select onValueChange={(status) => updateTicketStatus(ticket.id, status)}>
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">From:</h4>
                <p>{selectedTicket.name} ({selectedTicket.email})</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Type:</h4>
                <p>{selectedTicket.inquiry_type}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Message:</h4>
                <p className="text-sm text-muted-foreground">{selectedTicket.message}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Admin Notes:</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
              </div>
              <Button onClick={saveAdminNotes} className="w-full">
                Save Notes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
