import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Settings, Webhook, Zap, Plus, TestTube } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  serviceName: string;
  serviceType: string;
  isActive: boolean;
  lastSync: string | null;
  configuration: any;
}

interface Template {
  id: string;
  name: string;
  serviceType: string;
  description: string;
  configurationSchema: any;
  webhookEvents: string[];
  setupInstructions: string;
  isFeatured: boolean;
}

export function APIIntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
    loadTemplates();
    loadSyncLogs();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive"
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_templates')
        .select('*')
        .order('is_featured', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select(`
          *,
          api_configurations(service_name, service_type)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    }
  };

  const testConnection = async (config: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'test_connection', config }
      });

      if (error) throw error;
      setTestResults(data.testResult);
      
      toast({
        title: data.testResult.success ? "Connection Successful" : "Connection Failed",
        description: data.testResult.message,
        variant: data.testResult.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Unable to test connection",
        variant: "destructive"
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'sync_data', integrationId }
      });

      if (error) throw error;
      
      toast({
        title: "Sync Completed",
        description: `Processed ${data.syncResults.recordsProcessed} records`,
      });
      
      loadSyncLogs();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync data",
        variant: "destructive"
      });
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'slack': return '💬';
      case 'teams': return '👥';
      case 'jira': return '📋';
      case 'security': return '🔒';
      default: return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">API Integration Hub</h2>
          <p className="text-muted-foreground">Connect with external services and manage integrations</p>
        </div>
        <Button onClick={() => setIsConfiguring(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Active Integrations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getServiceIcon(integration.serviceType)}</span>
                      <div>
                        <CardTitle className="text-sm">{integration.serviceName}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.serviceType.toUpperCase()}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch 
                      checked={integration.isActive}
                      onCheckedChange={() => {/* Toggle integration */}}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Status:</span>
                    <Badge variant={integration.isActive ? "default" : "secondary"}>
                      {integration.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {integration.lastSync && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Sync:</span>
                      <span className="text-muted-foreground">
                        {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncIntegration(integration.id)}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className={template.isFeatured ? "border-blue-200" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getServiceIcon(template.serviceType)}</span>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.serviceType.toUpperCase()}</CardDescription>
                      </div>
                    </div>
                    {template.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.webhookEvents.map((event, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsConfiguring(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Webhook Management
              </CardTitle>
              <CardDescription>
                Configure and monitor webhook endpoints for real-time data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Security Alerts Webhook</h4>
                    <p className="text-sm text-muted-foreground">
                      https://api.example.com/webhooks/security
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">System Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      https://api.example.com/webhooks/system
                    </p>
                  </div>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
              <CardDescription>
                Monitor integration performance and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {log.api_configurations?.service_name || 'Unknown Service'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.operation_type} • {log.records_processed} records
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}