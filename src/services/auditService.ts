import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityPattern: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ComplianceReport {
  id: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  generatedBy: string;
  reportData: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

class AuditService {
  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('audit-logger', {
        body: {
          userId: entry.userId,
          actionType: entry.actionType,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent || navigator.userAgent,
          sessionId: entry.sessionId,
          severity: entry.severity || 'info',
          status: entry.status || 'success',
          metadata: entry.metadata || {}
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log audit activity:', error);
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    actionType?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getSuspiciousActivities(): Promise<SuspiciousActivity[]> {
    const { data, error } = await supabase
      .from('suspicious_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateSuspiciousActivity(id: string, updates: Partial<SuspiciousActivity>): Promise<void> {
    const { error } = await supabase
      .from('suspicious_activities')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async generateComplianceReport(
    reportType: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ComplianceReport> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('compliance-reporter', {
      body: {
        reportType,
        periodStart,
        periodEnd,
        userId: user.user?.id
      }
    });

    if (error) throw error;
    return data.report;
  }

  async getComplianceReports(): Promise<ComplianceReport[]> {
    const { data, error } = await supabase
      .from('compliance_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActivityStats(timeRange: string = '7d'): Promise<{
    totalActivities: number;
    failedAttempts: number;
    suspiciousActivities: number;
    criticalEvents: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const [activities, suspicious] = await Promise.all([
      this.getAuditLogs({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }),
      supabase
        .from('suspicious_activities')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ]);

    const failedAttempts = activities.filter(a => a.status === 'failure').length;
    const criticalEvents = activities.filter(a => a.severity === 'critical').length;

    return {
      totalActivities: activities.length,
      failedAttempts,
      suspiciousActivities: suspicious.data?.length || 0,
      criticalEvents
    };
  }
}

export const auditService = new AuditService();