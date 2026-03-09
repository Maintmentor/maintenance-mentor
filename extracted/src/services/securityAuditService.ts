import { supabase } from '@/lib/supabase';

export interface SecurityAudit {
  id: string;
  audit_type: string;
  domain: string;
  status: string;
  score: number;
  findings: any[];
  recommendations: string[];
  metadata: any;
  created_at: string;
  completed_at?: string;
}

export interface VulnerabilityScan {
  id: string;
  audit_id: string;
  vulnerability_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_component: string;
  remediation: string;
  cve_id?: string;
  cvss_score?: number;
  status: 'open' | 'resolved' | 'mitigated';
}

export interface DependencyCheck {
  id: string;
  audit_id: string;
  package_name: string;
  current_version: string;
  latest_version: string;
  security_advisories: any[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  update_available: boolean;
}

class SecurityAuditService {
  async runSecurityAudit(domain: string, auditType: string = 'full'): Promise<SecurityAudit> {
    try {
      // Call the security audit engine
      const { data: auditData, error: auditError } = await supabase.functions.invoke('security-audit-engine', {
        body: { domain, auditType }
      });

      if (auditError) throw auditError;

      // Store audit results in database
      const { data: audit, error: insertError } = await supabase
        .from('security_audits')
        .insert({
          audit_type: auditType,
          domain,
          status: 'completed',
          score: auditData.score,
          findings: auditData.vulnerabilities,
          recommendations: auditData.recommendations,
          metadata: {
            sslInfo: auditData.sslInfo,
            securityHeaders: auditData.securityHeaders,
            timestamp: auditData.timestamp
          },
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store vulnerability findings
      if (auditData.vulnerabilities?.length > 0) {
        const vulnData = auditData.vulnerabilities.map((vuln: any) => ({
          audit_id: audit.id,
          vulnerability_type: vuln.type,
          severity: vuln.severity,
          description: vuln.description,
          affected_component: domain,
          remediation: vuln.remediation,
          status: 'open'
        }));

        await supabase.from('vulnerability_scans').insert(vulnData);
      }

      return audit;
    } catch (error) {
      console.error('Security audit failed:', error);
      throw error;
    }
  }

  async getAuditHistory(limit: number = 10): Promise<SecurityAudit[]> {
    const { data, error } = await supabase
      .from('security_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getVulnerabilities(auditId?: string): Promise<VulnerabilityScan[]> {
    let query = supabase.from('vulnerability_scans').select('*');
    
    if (auditId) {
      query = query.eq('audit_id', auditId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async resolveVulnerability(vulnerabilityId: string): Promise<void> {
    const { error } = await supabase
      .from('vulnerability_scans')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', vulnerabilityId);

    if (error) throw error;
  }

  async scheduleAudit(domain: string, interval: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    // This would integrate with a scheduling system
    console.log(`Scheduled ${interval} audit for ${domain}`);
  }

  async generateSecurityReport(auditId: string): Promise<string> {
    const { data: audit, error: auditError } = await supabase
      .from('security_audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (auditError) throw auditError;

    const { data: vulnerabilities, error: vulnError } = await supabase
      .from('vulnerability_scans')
      .select('*')
      .eq('audit_id', auditId);

    if (vulnError) throw vulnError;

    // Generate comprehensive report
    const report = {
      title: `Security Audit Report - ${audit.domain}`,
      date: new Date().toISOString(),
      score: audit.score,
      summary: `Security audit completed for ${audit.domain} with a score of ${audit.score}/100`,
      vulnerabilities: vulnerabilities || [],
      recommendations: audit.recommendations || [],
      metadata: audit.metadata
    };

    return JSON.stringify(report, null, 2);
  }
}

export const securityAuditService = new SecurityAuditService();