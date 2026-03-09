import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Shield, 
  Calendar, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledAudit {
  id: string;
  domain: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  auditTypes: string[];
}

export const AutomatedSecurityScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledAudit[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedAuditTypes, setSelectedAuditTypes] = useState<string[]>(['full']);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing schedules
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    // Mock data - in real app, this would come from the database
    const mockSchedules: ScheduledAudit[] = [
      {
        id: '1',
        domain: 'example.com',
        frequency: 'weekly',
        enabled: true,
        lastRun: '2024-01-15T10:00:00Z',
        nextRun: '2024-01-22T10:00:00Z',
        auditTypes: ['full', 'ssl', 'headers']
      },
      {
        id: '2',
        domain: 'app.example.com',
        frequency: 'daily',
        enabled: false,
        nextRun: '2024-01-16T02:00:00Z',
        auditTypes: ['ssl', 'vulnerabilities']
      }
    ];
    setSchedules(mockSchedules);
  };

  const addSchedule = () => {
    if (!newDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain",
        variant: "destructive"
      });
      return;
    }

    const newSchedule: ScheduledAudit = {
      id: Date.now().toString(),
      domain: newDomain,
      frequency: newFrequency,
      enabled: true,
      nextRun: calculateNextRun(newFrequency),
      auditTypes: selectedAuditTypes
    };

    setSchedules(prev => [...prev, newSchedule]);
    setNewDomain('');
    toast({
      title: "Schedule Added",
      description: `Automated security audit scheduled for ${newDomain}`
    });
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    toast({
      title: "Schedule Removed",
      description: "Automated security audit schedule has been removed"
    });
  };

  const calculateNextRun = (frequency: string): string => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const auditTypeOptions = [
    { value: 'full', label: 'Full Security Audit' },
    { value: 'ssl', label: 'SSL Certificate Check' },
    { value: 'headers', label: 'Security Headers' },
    { value: 'vulnerabilities', label: 'Vulnerability Scan' },
    { value: 'dependencies', label: 'Dependency Check' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Automated Security Scheduler
          </CardTitle>
          <CardDescription>
            Schedule regular security audits to run automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={newFrequency} onValueChange={(value: any) => setNewFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Audit Types</Label>
                <div className="flex flex-wrap gap-2">
                  {auditTypeOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant={selectedAuditTypes.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedAuditTypes(prev => 
                          prev.includes(option.value)
                            ? prev.filter(t => t !== option.value)
                            : [...prev, option.value]
                        );
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <Button onClick={addSchedule} className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Security Audit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Scheduled Audits</h3>
        
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No scheduled audits. Add one above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {schedule.domain}
                    </CardTitle>
                    <CardDescription>
                      {schedule.auditTypes.join(', ')} audit
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getFrequencyColor(schedule.frequency)}>
                      {schedule.frequency}
                    </Badge>
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Next Run</h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(schedule.nextRun).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {schedule.lastRun && (
                      <div>
                        <h4 className="font-medium mb-2">Last Run</h4>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">
                            {new Date(schedule.lastRun).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {schedule.enabled ? (
                        <Play className="w-4 h-4 text-green-600" />
                      ) : (
                        <Pause className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm">
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.enabled ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};