import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, MessageCircle, DollarSign, Calendar } from 'lucide-react';
import ChatInterface from '@/components/chat/EnhancedChatInterface';

import ConversationList from '@/components/chat/ConversationList';
import { TrialAccessGate } from '@/components/chat/TrialAccessGate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function RepairDashboard() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationStats, setConversationStats] = useState({
    total: 0,
    thisMonth: 0,
    totalCost: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('estimated_cost_min, estimated_cost_max, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading stats:', error);
      return;
    }

    const now = new Date();
    const thisMonth = conversations?.filter(c => 
      new Date(c.created_at).getMonth() === now.getMonth() &&
      new Date(c.created_at).getFullYear() === now.getFullYear()
    ).length || 0;

    const totalCost = conversations?.reduce((sum, c) => {
      if (c.estimated_cost_min && c.estimated_cost_max) {
        return sum + (c.estimated_cost_min + c.estimated_cost_max) / 2;
      }
      return sum;
    }, 0) || 0;

    setConversationStats({
      total: conversations?.length || 0,
      thisMonth,
      totalCost
    });
  };

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `Repair Consultation - ${new Date().toLocaleDateString()}`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setSelectedConversationId(data.id);
    loadStats();
  };

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleCategoryDetected = (category: string) => {
    // Update conversation title with category
    if (selectedConversationId) {
      supabase
        .from('conversations')
        .update({ title: `${category} Repair Consultation` })
        .eq('id', selectedConversationId)
        .then(() => loadStats());
    }
  };

  const handleCostEstimated = (min: number, max: number) => {
    loadStats();
  };

  return (
    <TrialAccessGate>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Repair Dashboard</h1>
          <p className="text-gray-600">Get expert maintenance guidance with AI-powered diagnostics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consultations</p>
                <p className="text-2xl font-bold">{conversationStats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{conversationStats.thisMonth}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Est. Total Costs</p>
                <p className="text-2xl font-bold">${conversationStats.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ConversationList
              selectedId={selectedConversationId || undefined}
              onSelect={handleConversationSelect}
              onNew={createNewConversation}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedConversationId ? (
              <Card className="h-[calc(100vh-300px)] flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold mb-2">Ask Maintenance Mentor</h2>
                  <p className="text-gray-600">
                    Upload photos and describe your repair issue for expert AI-powered guidance
                  </p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    conversationId={selectedConversationId}
                    onMessageSent={() => loadStats()}
                  />
                </div>
              </Card>

            ) : (
              <Card className="p-8 text-center">
                <Wrench className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Welcome to Maintenance Mentor</h3>
                <p className="text-gray-600 mb-4">
                  Start a new conversation to get expert repair guidance powered by AI
                </p>
                <Badge variant="secondary" className="mb-4">
                  Photo analysis • Cost estimation • Step-by-step guidance
                </Badge>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TrialAccessGate>
  );
}
