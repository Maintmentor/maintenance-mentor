import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Sparkles, Construction } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ 
  title = "Coming Soon", 
  description = "This feature is currently under development and will be available soon.",
  icon
}: ComingSoonProps) {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-8">
      <Card className="border-4 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl max-w-2xl w-full">
        <CardHeader className="text-center pb-6 pt-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-full shadow-xl">
                {icon || <Clock className="h-16 w-16 text-white" />}
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {title}
          </CardTitle>
          <CardDescription className="text-lg mt-4 text-gray-700">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-12">
          <div className="flex items-center justify-center gap-3 text-base font-medium text-blue-600 mb-6">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            <span>We're working hard to bring you this feature</span>
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Construction className="h-4 w-4" />
            <span>Under Active Development</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
