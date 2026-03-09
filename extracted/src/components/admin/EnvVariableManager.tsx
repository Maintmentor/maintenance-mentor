import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Key, Mail, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnvVariable {
  masked: string;
  type: string;
  functions: string[];
}

interface TestResult {
  valid: boolean;
  message: string;
  status?: number;
}

export default function EnvVariableManager() {
  const [variables, setVariables] = useState<Record<string, EnvVariable>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('env-variable-manager', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setVariables(data.variables);
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

  const testVariable = async (varName: string) => {
    setTesting(prev => ({ ...prev, [varName]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('env-variable-manager', {
        body: { action: 'test', variable: varName }
      });

      if (error) throw error;
      setTestResults(prev => ({ ...prev, [varName]: data }));
      
      toast({
        title: data.valid ? 'Valid' : 'Invalid',
        description: data.message,
        variant: data.valid ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(prev => ({ ...prev, [varName]: false }));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api_key': return <Key className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      api_key: 'bg-blue-500',
      email: 'bg-green-500',
      config: 'bg-purple-500',
      private_key: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Environment Variables</h2>
        <p className="text-muted-foreground">Manage and test edge function environment variables</p>
      </div>

      <div className="grid gap-4">
        {Object.entries(variables).map(([name, variable]) => (
          <Card key={name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(variable.type)}
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <Badge className={getTypeBadge(variable.type)}>
                    {variable.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testVariable(name)}
                    disabled={testing[name]}
                  >
                    {testing[name] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription>
                Used by {variable.functions.length} function(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Value</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type={revealed[name] ? 'text' : 'password'}
                    value={variable.masked}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRevealed(prev => ({ ...prev, [name]: !prev[name] }))}
                  >
                    {revealed[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {testResults[name] && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResults[name].valid ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
                }`}>
                  {testResults[name].valid ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{testResults[name].message}</span>
                  {testResults[name].status && (
                    <Badge variant="outline" className="ml-auto">
                      Status: {testResults[name].status}
                    </Badge>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Used by Functions</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variable.functions.map(func => (
                    <Badge key={func} variant="secondary">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}