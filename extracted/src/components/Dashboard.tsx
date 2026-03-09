import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RepairHistoryList from '@/components/repair-history/RepairHistoryList';
import RepairForm from '@/components/repair-history/RepairForm';
import MaintenanceReminders from '@/components/maintenance/MaintenanceReminders';
import RepairDashboard from '@/components/RepairDashboard';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import AIFunctionTest from '@/components/ai/AIFunctionTest';
import ComingSoon from '@/components/ComingSoon';

import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { TrialExpirationModal } from '@/components/subscription/TrialExpirationModal';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { SavedDiagramsGallery } from '@/components/diagrams/SavedDiagramsGallery';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { 
  FileText, 
  Wrench, 
  Package, 
  Bell,
  MessageCircle,
  History,
  BarChart3,
  Image
} from 'lucide-react';

export default function Dashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('chat');
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Check if redirected from direct signup
  useEffect(() => {
    if (location.state?.showSubscription) {
      setShowSubscriptionModal(true);
    }
  }, [location.state]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmailVerificationBanner />
        <TrialCountdownBanner />
        <TrialExpirationModal />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Dashboard</h1>
          <p className="text-gray-600">Track repairs, manage parts, and stay on top of maintenance</p>
        </div>



        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="diagrams" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Diagrams
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Repair History
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Parts Tracker
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="question-analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Q&A Analytics
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai-test" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              AI Test
            </TabsTrigger>
          </TabsList>




          <TabsContent value="chat">
            <RepairDashboard />
          </TabsContent>

          <TabsContent value="diagrams">
            <Card>
              <CardHeader>
                <CardTitle>Saved Diagrams</CardTitle>
                <CardDescription>
                  View and manage all your AI-generated diagrams and illustrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SavedDiagramsGallery />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Repair History</h2>
                <Button onClick={() => setShowRepairForm(true)}>
                  Add Completed Repair
                </Button>
              </div>
              
              {showRepairForm ? (
                <RepairForm 
                  onSuccess={() => {
                    setShowRepairForm(false);
                  }}
                  onCancel={() => setShowRepairForm(false)}
                />
              ) : (
                <RepairHistoryList onSelectRepair={setSelectedRepair} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="parts">
            <ComingSoon 
              title="Parts Tracker Coming Soon"
              description="Track your maintenance parts inventory, orders, and suppliers. This feature will help you manage parts efficiently and never run out of essential supplies."
              icon={<Package className="h-12 w-12 text-white" />}
            />
          </TabsContent>


          <TabsContent value="reminders">
            <MaintenanceReminders />
          </TabsContent>

          <TabsContent value="reports">
            <ComingSoon 
              title="Reports Coming Soon"
              description="Generate comprehensive PDF reports of your maintenance history, costs, and analytics. Share reports via email with property owners, managers, or maintenance teams."
              icon={<FileText className="h-12 w-12 text-white" />}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ComingSoon 
              title="Analytics Coming Soon"
              description="View detailed analytics about your maintenance activities, costs over time, repair frequency, and efficiency metrics to optimize your operations."
              icon={<BarChart3 className="h-12 w-12 text-white" />}
            />
          </TabsContent>

          <TabsContent value="question-analytics">
            <ComingSoon 
              title="Q&A Analytics Coming Soon"
              description="Track your AI chat interactions, most common questions, response accuracy, and user satisfaction to improve the AI assistant experience."
              icon={<BarChart3 className="h-12 w-12 text-white" />}
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="ai-test">
            <AIFunctionTest />
          </TabsContent>

        </Tabs>


        {/* Subscription Modal for Direct Signup */}
        <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <SubscriptionManager />
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}