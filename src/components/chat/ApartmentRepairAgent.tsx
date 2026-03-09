import React from 'react';
import ChatInterface from './EnhancedChatInterface';

import { Home } from 'lucide-react';

interface ApartmentRepairAgentProps {
  conversationId: string;
}

export default function ApartmentRepairAgent({ conversationId }: ApartmentRepairAgentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Home className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Apartment Repair Assistant</h1>
        </div>
        <p className="text-blue-100">
          Expert guidance for residential apartment maintenance & troubleshooting
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          conversationId={conversationId}
          initialMessage=""
        />
      </div>
    </div>
  );
}

