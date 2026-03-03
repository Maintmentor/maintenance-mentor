import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementDashboard } from '@/components/admin/UserManagementDashboard';
import { SystemActivityMonitor } from '@/components/admin/SystemActivityMonitor';
import { SupportTicketManager } from '@/components/admin/SupportTicketManager';
import { UserSubscriptionManager } from '@/components/admin/UserSubscriptionManager';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { ImageCacheManager } from '@/components/admin/ImageCacheManager';
import CachePrewarmingManager from '@/components/admin/CachePrewarmingManager';
import CacheAnalyticsDashboard from '@/components/admin/CacheAnalyticsDashboard';
import { CacheAlertSettings } from '@/components/admin/CacheAlertSettings';
import { CacheAlertHistory } from '@/components/admin/CacheAlertHistory';
import { CacheEmailNotificationSettings } from '@/components/admin/CacheEmailNotificationSettings';
import { CacheEmailNotificationHistory } from '@/components/admin/CacheEmailNotificationHistory';
import HealthCheckDashboard from '@/components/admin/HealthCheckDashboard';
import { DomainHealthDashboard } from '@/components/domain/DomainHealthDashboard';
import { VideoUploadManager } from '@/components/admin/VideoUploadManager';
import { TrialAnalyticsDashboard } from '@/components/analytics/TrialAnalyticsDashboard';
import { ImageQualityDashboard } from '@/components/analytics/ImageQualityDashboard';
import MLImageQualityDashboard from '@/components/analytics/MLImageQualityDashboard';
import { AlertAnalyticsDashboard } from '@/components/analytics/AlertAnalyticsDashboard';
import { MLModelTrainer } from '@/components/ml/MLModelTrainer';
import { MLModelRetrainingDashboard } from '@/components/admin/MLModelRetrainingDashboard';
import { AdvancedMLDashboard } from '@/components/analytics/AdvancedMLDashboard';
import { APIKeyStatusDashboard } from '@/components/admin/APIKeyStatusDashboard';
import StorageManager from '@/components/admin/StorageManager';
import { StorageMonitoringDashboard } from '@/components/admin/StorageMonitoringDashboard';
import { RealtimeStorageDashboard } from '@/components/admin/RealtimeStorageDashboard';
import { EnvBackupManager } from '@/components/admin/EnvBackupManager';
import { Shield } from 'lucide-react';
import SlackWebhookConfig from '@/components/admin/SlackWebhookConfig';
import SlackNotificationHistory from '@/components/admin/SlackNotificationHistory';
import ConnectionDiagnostics from '@/components/admin/ConnectionDiagnostics';
import AIConnectionStatus from '@/components/admin/AIConnectionStatus';
import AIConnectionDiagnostics from '@/components/admin/AIConnectionDiagnostics';
import GoogleSheetsManager from '@/components/admin/GoogleSheetsManager';
import GoogleSheetsAnalyticsDashboard from '@/components/analytics/GoogleSheetsAnalyticsDashboard';
import EdgeFunctionDiagnostics from '@/components/admin/EdgeFunctionDiagnostics';
import AIAssistantConnectionTest from '@/components/admin/AIAssistantConnectionTest';
import { TranslationFeedbackDashboard } from '@/components/admin/TranslationFeedbackDashboard';
import { MLRetrainingDashboard } from '@/components/admin/MLRetrainingDashboard';
import { MLModelVersionHistory } from '@/components/admin/MLModelVersionHistory';
import { ABTestingDashboard } from '@/components/admin/ABTestingDashboard';
import TranslationCostDashboard from '@/components/admin/TranslationCostDashboard';
import TranslationProviderDashboard from '@/components/admin/TranslationProviderDashboard';
import ProviderRoutingRules from '@/components/admin/ProviderRoutingRules';
import ProviderComparisonChart from '@/components/admin/ProviderComparisonChart';
import EdgeFunctionDeploymentManager from '@/components/admin/EdgeFunctionDeploymentManager';
import OpenAIKeyMonitor from '@/components/admin/OpenAIKeyMonitor';
import { OneClickDeployment } from '@/components/admin/OneClickDeployment';
import ConfigurationDiagnostic from '@/components/admin/ConfigurationDiagnostic';
import { AutomatedConfigRepair } from '@/components/admin/AutomatedConfigRepair';
import EnvVariableManager from '@/components/admin/EnvVariableManager';



















const Admin: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage users, monitor system activity, and view analytics</p>
          </div>
          <Tabs defaultValue="diagnostics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-11 lg:grid-cols-21">
              <TabsTrigger value="env-vars">Env Vars</TabsTrigger>
              <TabsTrigger value="deployment">Deploy</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="routing">Routing</TabsTrigger>
              <TabsTrigger value="translation">Feedback</TabsTrigger>

              <TabsTrigger value="cost">Cost</TabsTrigger>
              <TabsTrigger value="ml-retrain">ML Retrain</TabsTrigger>
              <TabsTrigger value="ml-versions">Versions</TabsTrigger>
              <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
              <TabsTrigger value="sheets">Sheets</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="slack">Slack</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="subscriptions">Subs</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="trials">Trials</TabsTrigger>
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="email-alerts">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="env-vars">
              <EnvVariableManager />
            </TabsContent>



            <TabsContent value="deployment">
              <div className="space-y-6">
                <OneClickDeployment />
                <EdgeFunctionDeploymentManager />
              </div>
            </TabsContent>



            <TabsContent value="providers">
              <div className="space-y-6">
                <TranslationProviderDashboard />
                <ProviderComparisonChart />
              </div>
            </TabsContent>

            <TabsContent value="routing">
              <ProviderRoutingRules />
            </TabsContent>

            <TabsContent value="translation">
              <TranslationFeedbackDashboard />
            </TabsContent>


            <TabsContent value="cost">
              <TranslationCostDashboard />
            </TabsContent>



            <TabsContent value="ml-retrain">
              <MLRetrainingDashboard />
            </TabsContent>

            <TabsContent value="ml-versions">
              <MLModelVersionHistory />
            </TabsContent>

            <TabsContent value="ab-tests">
              <ABTestingDashboard />
            </TabsContent>


            <TabsContent value="sheets">
              <GoogleSheetsManager />
            </TabsContent>

            <TabsContent value="sheets-analytics">
              <GoogleSheetsAnalyticsDashboard />
            </TabsContent>


            <TabsContent value="diagnostics">
              <div className="space-y-6">
                <AutomatedConfigRepair />
                <ConfigurationDiagnostic />
                <AIAssistantConnectionTest />
                <EdgeFunctionDiagnostics />
                <AIConnectionStatus />
                <AIConnectionDiagnostics />
                <ConnectionDiagnostics />
              </div>
            </TabsContent>

            <TabsContent value="api-keys">
              <div className="space-y-6">
                <OpenAIKeyMonitor />
                <APIKeyStatusDashboard />
              </div>
            </TabsContent>




            <TabsContent value="slack">

              <div className="space-y-6">
                <SlackWebhookConfig />
                <SlackNotificationHistory />
              </div>
            </TabsContent>

            <TabsContent value="env-backup">
              <EnvBackupManager />
            </TabsContent>


            <TabsContent value="users">
              <UserManagementDashboard />
            </TabsContent>


            <TabsContent value="subscriptions">
              <UserSubscriptionManager />
            </TabsContent>


            <TabsContent value="videos">
              <VideoUploadManager />
            </TabsContent>


            <TabsContent value="storage">
              <StorageManager />
            </TabsContent>


            <TabsContent value="monitoring">
              <StorageMonitoringDashboard />
            </TabsContent>


            <TabsContent value="realtime">
              <RealtimeStorageDashboard />
            </TabsContent>


            <TabsContent value="health">
              <HealthCheckDashboard />
            </TabsContent>


            <TabsContent value="activity">
              <SystemActivityMonitor />
            </TabsContent>


            <TabsContent value="tickets">
              <SupportTicketManager />
            </TabsContent>


            <TabsContent value="analytics">
              <AdminAnalytics />
            </TabsContent>


            <TabsContent value="trials">
              <TrialAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="domain">
              <DomainHealthDashboard />
            </TabsContent>

            <TabsContent value="cache">
              <ImageCacheManager />
            </TabsContent>

            <TabsContent value="cache-analytics">
              <CacheAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="cache-alerts">
              <div className="space-y-6">
                <CacheAlertSettings />
                <CacheAlertHistory />
              </div>
            </TabsContent>

            <TabsContent value="email-alerts">
              <div className="space-y-6">
                <CacheEmailNotificationSettings />
                <CacheEmailNotificationHistory />
              </div>
            </TabsContent>

            <TabsContent value="images">
              <ImageQualityDashboard />
            </TabsContent>

            <TabsContent value="ml-images">
              <MLImageQualityDashboard />
            </TabsContent>

            <TabsContent value="advanced-ml">
              <AdvancedMLDashboard />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertAnalyticsDashboard />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
