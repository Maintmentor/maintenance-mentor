import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
  integration?: any;
}

export function IntegrationConfigModal({ 
  isOpen, 
  onClose, 
  template, 
  integration 
}: IntegrationConfigModalProps) {
  const [config, setConfig] = useState<any>({});
  const [webhooks, setWebhooks] = useState<string[]>([]);
  const [dataMappings, setDataMappings] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setConfig({
        serviceName: template.name,
        serviceType: template.serviceType,
        ...Object.keys(template.configurationSchema).reduce((acc, key) => {
          acc[key] = '';
          return acc;
        }, {} as any)
      });
      setWebhooks(template.webhookEvents || []);
    }
  }, [template]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { 
          action: 'test_connection', 
          config: { ...config, serviceType: template?.serviceType }
        }
      });

      if (error) throw error;
      setTestResult(data.testResult);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed',
        latency: 0
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveIntegration = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('api_configurations')
        .insert({
          service_name: config.serviceName,
          service_type: template?.serviceType,
          configuration: config,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Integration Saved",
        description: "Your integration has been configured successfully",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save integration configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigField = (key: string, schema: any) => {
    const value = config[key] || '';
    
    switch (schema.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
            <Label>{schema.description}</Label>
          </div>
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleConfigChange(key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${key}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.description}
            rows={3}
          />
        );
      
      default:
        return (
          <Input
            type={key.includes('password') || key.includes('token') || key.includes('key') ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.description}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {integration ? 'Edit Integration' : 'Configure Integration'}
          </DialogTitle>
          <DialogDescription>
            {template ? `Set up ${template.name} integration` : 'Configure your integration settings'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configuration" className="space-y-4">
          <TabsList>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="test">Test Connection</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>
                  Configure the basic settings for your integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                      id="serviceName"
                      value={config.serviceName || ''}
                      onChange={(e) => handleConfigChange('serviceName', e.target.value)}
                      placeholder="Enter a name for this integration"
                    />
                  </div>
                  
                  {template?.configurationSchema && Object.entries(template.configurationSchema).map(([key, schema]: [string, any]) => (
                    <div key={key}>
                      <Label htmlFor={key}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {schema.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderConfigField(key, schema)}
                      {schema.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {schema.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {template?.setupInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Setup Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm">
                    {template.setupInstructions.split('\n').map((line: string, index: number) => (
                      <p key={index} className="text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
                <CardDescription>
                  Configure which events should trigger webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {webhooks.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{event}</h4>
                        <p className="text-xs text-muted-foreground">
                          Triggered when {event.replace(/_/g, ' ')} occurs
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Field Mapping</CardTitle>
                <CardDescription>
                  Map data fields between your system and the external service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                    <div>Source Field</div>
                    <div>Target Field</div>
                    <div>Transformation</div>
                  </div>
                  {[
                    { source: 'user_id', target: 'userId', transform: 'none' },
                    { source: 'alert_type', target: 'severity', transform: 'uppercase' },
                    { source: 'timestamp', target: 'created_at', transform: 'iso_date' }
                  ].map((mapping, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4">
                      <Input value={mapping.source} placeholder="Source field" />
                      <Input value={mapping.target} placeholder="Target field" />
                      <Select value={mapping.transform}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="uppercase">Uppercase</SelectItem>
                          <SelectItem value="lowercase">Lowercase</SelectItem>
                          <SelectItem value="iso_date">ISO Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Test</CardTitle>
                <CardDescription>
                  Test your configuration before saving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  className="w-full"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
                </Button>

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {testResult.message}
                        </p>
                        {testResult.latency > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Response time: {testResult.latency}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={saveIntegration}
            disabled={isSaving || !testResult?.success}
          >
            {isSaving ? 'Saving...' : 'Save Integration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}