import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ApartmentRepairAgent from '@/components/chat/ApartmentRepairAgent';
import PublicChatDemo from '@/components/PublicChatDemo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();

  const createConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id || null,
          title: 'Apartment Repair Chat',
          category: 'General'
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setConversationId(crypto.randomUUID());
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Always create a conversation ID (for both authenticated and guest users)
    if (!conversationId) {
      if (user) {
        createConversation();
      } else {
        // For guest users, use a temporary UUID
        setConversationId(crypto.randomUUID());
      }
    }
  };


  // Show chat button for all users (public and authenticated)


  return (
    <>
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[700px] p-0 flex flex-col">
          <DialogTitle className="sr-only">
            Apartment Repair Assistant
          </DialogTitle>
          <div className="flex-1 overflow-hidden">
            {conversationId ? (
              <ApartmentRepairAgent conversationId={conversationId} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading chat...</p>
                </div>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}

