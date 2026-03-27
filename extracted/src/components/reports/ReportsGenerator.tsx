import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import EmailReportModal from './EmailReportModal';
import {
  FileText,
  Download,
  Mail,
  DollarSign,
  Wrench,
  Clock,
  Calendar,
  Package
} from 'lucide-react';

interface RepairRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  actual_cost: number;
  time_spent: number;
  completion_date: string;
  difficulty_level: number;
  tags: string[];
}

interface ReportSummary {
  totalRepairs: number;
  totalCost: number;
  totalTimeMinutes: number;
  categories: Record<string, number>;
  dateRange: { start: string; end: string };
}

export default function ReportsGenerator() {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('3months');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRepairs();
    }
  }, [user, dateRange]);

  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case '1month': now.setMonth(now.getMonth() - 1); break;
      case '3months': now.setMonth(now.getMonth() - 3); break;
      case '6months': now.setMonth(now.getMonth() - 6); break;
      case '1year': now.setFullYear(now.getFullYear() - 1); break;
      default: return null;
    }
    return now.toISOString();
  };

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('repair_history')
        .select('*')
        .order('completion_date', { ascending: false });

      const startDate = getStartDate();
      if (startDate) {
        query = query.gte('completion_date', startDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const records = data || [];
      setRepairs(records);

      const totalCost = records.reduce((sum, r) => sum + (r.actual_cost || 0), 0);
      const totalTime = records.reduce((sum, r) => sum + (r.time_spent || 0), 0);
      const categories: Record<string, number> = {};
      records.forEach(r => {
        if (r.category) {
          categories[r.category] = (categories[r.category] || 0) + 1;
        }
      });

      const dates = records.map(r => r.completion_date).filter(Boolean).sort();
      setReportSummary({
        totalRepairs: records.length,
        totalCost,
        totalTimeMinutes: totalTime,
        categories,
        dateRange: {
          start: dates[0] ? new Date(dates[0]).toLocaleDateString() : 'N/A',
          end: dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString() : 'N/A',
        },
      });
    } catch (error) {
      console.error('Error fetching repairs:', error);
      toast({ title: 'Error', description: 'Failed to load repair data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = () => {
    if (!repairs.length) return;

    const headers = ['Title', 'Category', 'Completion Date', 'Actual Cost ($)', 'Time Spent (min)', 'Difficulty', 'Description', 'Tags'];
    const rows = repairs.map(r => [
      `"${r.title || ''}"`,
      `"${r.category || ''}"`,
      r.completion_date ? new Date(r.completion_date).toLocaleDateString() : '',
      r.actual_cost?.toFixed(2) || '0.00',
      r.time_spent || '0',
      r.difficulty_level || '',
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.tags || []).join(', ')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({ title: 'Success', description: 'Report downloaded as CSV!' });
  };

  const handleSendEmail = async (emailData: { recipientEmail: string; recipientName?: string; customMessage?: string }) => {
    const { error } = await supabase.functions.invoke('contact-form-handler', {
      body: {
        name: emailData.recipientName || 'Recipient',
        email: emailData.recipientEmail,
        message: `Maintenance Report\n\nTotal Repairs: ${reportSummary?.totalRepairs}\nTotal Cost: $${reportSummary?.totalCost.toFixed(2)}\nDate Range: ${reportSummary?.dateRange.start} - ${reportSummary?.dateRange.end}\n\n${emailData.customMessage || ''}`,
        subject: 'Maintenance Report',
      },
    });
    if (error) throw error;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-gray-600">Generate and share maintenance reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last month</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateCSV} disabled={!repairs.length} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button onClick={() => setIsEmailModalOpen(true)} disabled={!repairs.length}>
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Repairs</p>
                <p className="text-3xl font-bold">{reportSummary?.totalRepairs ?? 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-3xl font-bold">${reportSummary?.totalCost.toFixed(2) ?? '0.00'}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-3xl font-bold">
                  {Math.floor((reportSummary?.totalTimeMinutes ?? 0) / 60)}h
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-3xl font-bold">
                  {Object.keys(reportSummary?.categories ?? {}).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repair Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Repair Records
          </CardTitle>
          <CardDescription>
            {repairs.length > 0
              ? `${repairs.length} record${repairs.length !== 1 ? 's' : ''} from ${reportSummary?.dateRange.start} to ${reportSummary?.dateRange.end}`
              : 'No repairs found for the selected period'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repairs.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No repair records found.</p>
              <p className="text-gray-400 text-sm mt-1">Add repairs in the Repair History tab to generate reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {repairs.map((repair) => (
                <div key={repair.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{repair.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      {repair.completion_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(repair.completion_date).toLocaleDateString()}
                        </span>
                      )}
                      {repair.actual_cost != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${repair.actual_cost.toFixed(2)}
                        </span>
                      )}
                      {repair.time_spent != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(repair.time_spent / 60)}h {repair.time_spent % 60}m
                        </span>
                      )}
                    </div>
                  </div>
                  {repair.category && (
                    <Badge variant="secondary" className="shrink-0">{repair.category}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(reportSummary?.categories ?? {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Number of repairs by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportSummary!.categories)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / (reportSummary?.totalRepairs || 1)) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        reportData={reportSummary}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
}
