import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Play,
  RefreshCw,
  Bug,
  Package,
  Calendar
} from 'lucide-react';
import { securityAuditService, SecurityAudit, VulnerabilityScan } from '@/services/securityAuditService';
import { emailNotificationService } from '@/services/emailNotificationService';
import { auditService } from '@/services/auditService';
import { AutomatedSecurityScheduler } from './AutomatedSecurityScheduler';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export const SecurityAuditDashboard: React.FC = () => {
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditDomain, setAuditDomain] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<SecurityAudit | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditHistory();
    loadVulnerabilities();
  }, []);

  const loadAuditHistory = async () => {
    try {
      const history = await securityAuditService.getAuditHistory();
      setAudits(history);
    } catch (error) {
      console.error('Failed to load audit history:', error);
    }
  };

  const loadVulnerabilities = async () => {
    try {
      const vulns = await securityAuditService.getVulnerabilities();
      setVulnerabilities(vulns);
    } catch (error) {
      console.error('Failed to load vulnerabilities:', error);
    }
  };

  const runAudit = async () => {
    if (!auditDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain to audit",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const audit = await securityAuditService.runSecurityAudit(auditDomain);
      setAudits(prev => [audit, ...prev]);
      setSelectedAudit(audit);
      
      // Log audit activity
      await auditService.logActivity({
        actionType: 'security_audit',
        resourceType: 'domain',
        resourceId: auditDomain,
        details: { score: audit.score, findings: audit.findings?.length || 0 },
        severity: audit.score < 60 ? 'high' : audit.score < 80 ? 'medium' : 'low',
        status: 'success'
      });
      
      // Send email notification for completed audit
      try {
        await emailNotificationService.sendSecurityAuditReport(audit.id, ['admin@example.com']);
      } catch (emailError) {
        console.error('Failed to send audit report email:', emailError);
      }
      
      toast({
        title: "Audit Complete",
        description: `Security audit completed with score: ${audit.score}/100`
      });
      await loadVulnerabilities();
    } catch (error) {
      // Log failed audit activity
      await auditService.logActivity({
        actionType: 'security_audit',
        resourceType: 'domain',
        resourceId: auditDomain,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        status: 'failure'
      });
      
      toast({
        title: "Audit Failed",
        description: "Failed to run security audit. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const downloadReport = async (auditId: string) => {
    try {
      const report = await securityAuditService.generateSecurityReport(auditId);
      const blob = new Blob([report], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${auditId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate security report",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Security Audit Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage security audits for your applications
          </p>
        </div>
      </div>
      <ProtectedRoute resource="security_audit" action="write">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Run Security Audit
            </CardTitle>
            <CardDescription>
              Start a comprehensive security audit for any domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter domain (e.g., example.com)"
                value={auditDomain}
                onChange={(e) => setAuditDomain(e.target.value)}
                className="flex-1"
              />
              <Button onClick={runAudit} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Audit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProtectedRoute>

      <Tabs defaultValue="audits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audits">Audit History</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="scheduler">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          {audits.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No security audits found. Run your first audit above.
                </p>
              </CardContent>
            </Card>
          ) : (
            audits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {audit.domain}
                      </CardTitle>
                      <CardDescription>
                        {new Date(audit.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                          {audit.score}/100
                        </div>
                        <div className="text-sm text-muted-foreground">Security Score</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(audit.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={audit.score} className="w-full" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Findings</h4>
                        <div className="text-2xl font-bold text-red-600">
                          {audit.findings?.length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Issues found</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Recommendations</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {audit.recommendations?.length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Suggested fixes</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Status</h4>
                        <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                          {audit.status}
                        </Badge>
                      </div>
                    </div>

                    {audit.recommendations && audit.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Recommendations</h4>
                        <ul className="space-y-1">
                          {audit.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {vulnerabilities.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No vulnerabilities found. Run a security audit to discover potential issues.
                </p>
              </CardContent>
            </Card>
          ) : (
            vulnerabilities.map((vuln) => (
              <Card key={vuln.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bug className="w-5 h-5" />
                        {vuln.vulnerability_type}
                      </CardTitle>
                      <CardDescription>{vuln.description}</CardDescription>
                    </div>
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Affected Component</h4>
                      <p className="text-sm text-muted-foreground">{vuln.affected_component}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Remediation</h4>
                      <p className="text-sm">{vuln.remediation}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant={vuln.status === 'resolved' ? 'default' : 'destructive'}>
                        {vuln.status}
                      </Badge>
                      {vuln.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={() => securityAuditService.resolveVulnerability(vuln.id)}
                        >
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Dependency Security Check
              </CardTitle>
              <CardDescription>
                Monitor your dependencies for known security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Dependency scanning will be available in the next audit run
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-4">
          <AutomatedSecurityScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
};