import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Shield, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface SecurityTrendsChartProps {
  data: {
    threatLevel: Array<{ timestamp: string; value: number; severity: string }>;
    vulnerabilities: any[];
    accessPatterns: any[];
    riskScore: number;
  };
}

export default function SecurityTrendsChart({ data }: SecurityTrendsChartProps) {
  const threatData = data.threatLevel.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    threats: item.value,
    severity: item.severity
  }));

  const getRiskLevel = (score: number) => {
    if (score > 70) return { level: 'High', color: 'destructive', icon: AlertTriangle };
    if (score > 40) return { level: 'Medium', color: 'secondary', icon: TrendingUp };
    return { level: 'Low', color: 'default', icon: Shield };
  };

  const riskInfo = getRiskLevel(data.riskScore);
  const RiskIcon = riskInfo.icon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold">{Math.round(data.riskScore)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <RiskIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={riskInfo.color as any}>{riskInfo.level} Risk</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Threats Detected</p>
                <p className="text-2xl font-bold">{data.threatLevel.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">-12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">847</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">+8% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Threat Level Trends</CardTitle>
          <CardDescription>Security threat levels over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={threatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="threats" 
                stroke="#ef4444" 
                fill="#fecaca" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Latest security incidents and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Failed Login', severity: 'high', time: '2 min ago', count: 5 },
                { type: 'Suspicious Access', severity: 'medium', time: '15 min ago', count: 1 },
                { type: 'Rate Limit Hit', severity: 'low', time: '1 hour ago', count: 12 },
                { type: 'Permission Denied', severity: 'medium', time: '2 hours ago', count: 3 }
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-4 w-4 ${
                      event.severity === 'high' ? 'text-red-500' :
                      event.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{event.type}</p>
                      <p className="text-sm text-gray-600">{event.time}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{event.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Status</CardTitle>
            <CardDescription>Current security vulnerabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Authentication', status: 'Secure', level: 'low' },
                { category: 'Data Encryption', status: 'Secure', level: 'low' },
                { category: 'Access Control', status: 'Attention Needed', level: 'medium' },
                { category: 'Network Security', status: 'Secure', level: 'low' }
              ].map((vuln, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{vuln.category}</p>
                    <p className="text-sm text-gray-600">{vuln.status}</p>
                  </div>
                  <Badge variant={vuln.level === 'low' ? 'default' : 'secondary'}>
                    {vuln.level === 'low' ? 'Secure' : 'Review'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}