import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  title: string;
  category?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function ConversationList({ selectedId, onSelect, onNew }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
    setLoading(false);
  };

  const formatCost = (min?: number, max?: number) => {
    if (!min || !max) return null;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Conversations</h3>
        <Button onClick={onNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to get repair help</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedId === conversation.id
                  ? 'bg-blue-100 border-blue-200 border'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{conversation.title}</h4>
                  <p className="text-sm text-gray-500">{formatDate(conversation.updated_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                {conversation.category && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {conversation.category}
                  </Badge>
                )}
                {conversation.estimated_cost_min && conversation.estimated_cost_max && (
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCost(conversation.estimated_cost_min, conversation.estimated_cost_max)}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}