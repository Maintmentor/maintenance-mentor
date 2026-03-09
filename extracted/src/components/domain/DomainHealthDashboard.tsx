import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DomainHealthCard } from './DomainHealthCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HealthCheck {
  dns: any;
  ssl: any;
  redirect: any;
  uptime: any;
}

export function DomainHealthDashboard() {
  const [checks, setChecks] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastCheck, setLastCheck] = useState<string>('');

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-health-monitor', {
        body: { domain: 'maintenancementor.io' }
      });

      if (error) throw error;
      
      setChecks(data.checks);
      setLastCheck(data.timestamp);

      // Check for alerts
      const newAlerts = [];
      if (data.checks.ssl?.status === 'critical') {
        newAlerts.push({
          type: 'ssl',
          message: 'SSL Certificate Issue Detected',
          severity: 'critical'
        });
      }
      if (data.checks.uptime?.status === 'critical') {
        newAlerts.push({
          type: 'uptime',
          message: 'Website Downtime Detected',
          severity: 'critical'
        });
      }
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Domain Health Monitor</h1>
            <p className="text-gray-600">maintenancementor.io</p>
          </div>
        </div>
        <Button onClick={runHealthCheck} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Alert key={idx} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DomainHealthCard
          title="DNS Status"
          status={checks?.dns?.status || 'checking'}
          details={checks?.dns?.resolved ? 'DNS resolving correctly' : 'DNS issues detected'}
          responseTime={checks?.dns?.responseTime}
          lastChecked={lastCheck}
        />
        <DomainHealthCard
          title="SSL Certificate"
          status={checks?.ssl?.status || 'checking'}
          details={checks?.ssl?.valid ? 'Certificate valid' : 'Certificate issue'}
          lastChecked={lastCheck}
        />
        <DomainHealthCard
          title="Redirects"
          status={checks?.redirect?.status || 'checking'}
          details={`Status: ${checks?.redirect?.redirectStatus || 'Checking...'}`}
          lastChecked={lastCheck}
        />
        <DomainHealthCard
          title="Uptime"
          status={checks?.uptime?.status || 'checking'}
          details={`HTTP ${checks?.uptime?.statusCode || '...'}`}
          responseTime={checks?.uptime?.responseTime}
          lastChecked={lastCheck}
        />
      </div>
    </div>
  );
}
