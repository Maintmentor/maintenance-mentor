import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serviceRequestService } from '@/services/databaseService';
import { Loader2, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ServiceRequestList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    
    // Subscribe to real-time status updates
    const subscription = serviceRequestService.subscribeToStatusUpdates((payload) => {
      setRequests(prev => prev.map(req => 
        req.id === payload.new.id ? payload.new : req
      ));
      
      toast({
        title: "Status Updated",
        description: `Request #${payload.new.id.slice(0, 8)} is now ${payload.new.status}`
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRequests = async () => {
    try {
      const data = await serviceRequestService.getAll();
      setRequests(data || []);
    } catch (error) {
      toast({
        title: "Error loading requests",
        description: "Failed to fetch service requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await serviceRequestService.updateStatus(id, status);
      toast({
        title: "Status updated",
        description: `Request status changed to ${status}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'outline';
      case 'in_progress': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch(urgency) {
      case 'emergency': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Service Requests</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{requests.filter(r => r.status === 'pending').length} Pending</Badge>
          <Badge variant="secondary">{requests.filter(r => r.status === 'in_progress').length} In Progress</Badge>
          <Badge>{requests.filter(r => r.status === 'completed').length} Completed</Badge>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No service requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                      <Badge variant={getUrgencyColor(request.urgency)}>
                        {request.urgency} priority
                      </Badge>
                      <Badge variant="outline">{request.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{request.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(request.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(request.id, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => updateStatus(request.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}