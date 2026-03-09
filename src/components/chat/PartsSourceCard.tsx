import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, ExternalLink, Info, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { imageFeedbackService } from '@/services/imageFeedbackService';
import { toast } from 'sonner';

interface PartSource {
  part: string;
  retailers: string[];
  estimatedPrice: string;
  partNumber?: string;
  notes?: string;
}

interface PartsSourceCardProps {
  partsSources: PartSource[];
}

export default function PartsSourceCard({ partsSources }: PartsSourceCardProps) {
  if (!partsSources || partsSources.length === 0) return null;

  const getRetailerUrl = (retailer: string, partName: string) => {
    const searchQuery = encodeURIComponent(partName);
    const urls: Record<string, string> = {
      'HD Supply': `https://www.hdsupply.com/s/${searchQuery}`,
      'Home Depot': `https://www.homedepot.com/s/${searchQuery}`,
      'Lowe\'s': `https://www.lowes.com/search?searchTerm=${searchQuery}`,
      'Amazon': `https://www.amazon.com/s?k=${searchQuery}`,
      'AutoZone': `https://www.autozone.com/searchresult?searchText=${searchQuery}`,
      'O\'Reilly': `https://www.oreillyauto.com/search?q=${searchQuery}`,
      'NAPA': `https://www.napaonline.com/en/search?text=${searchQuery}`,
      'McMaster-Carr': `https://www.mcmaster.com/products/${searchQuery}`,
      'Grainger': `https://www.grainger.com/search?searchQuery=${searchQuery}`,
      'Ferguson': `https://www.ferguson.com/search?searchTerm=${searchQuery}`,
      'Ace Hardware': `https://www.acehardware.com/search?query=${searchQuery}`,
      'Plumbing Supply Co.': `https://www.google.com/search?q=${searchQuery}+plumbing+supply`,
      'Electrical Supply Co.': `https://www.google.com/search?q=${searchQuery}+electrical+supply`,
      'Sherwin-Williams': `https://www.sherwin-williams.com/search/${searchQuery}`,
    };
    return urls[retailer] || `https://www.google.com/search?q=${searchQuery}+${retailer}`;
  };


  return (
    <Card className="p-4 bg-blue-50 border-blue-200 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Parts & Sources</h3>
      </div>
      
      <div className="space-y-4">
        {partsSources.map((source, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{source.part}</h4>
                {source.partNumber && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Part #: {source.partNumber}
                  </Badge>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <DollarSign className="w-3 h-3 mr-1" />
                {source.estimatedPrice}
              </Badge>
            </div>
            
            {source.notes && (
              <div className="flex items-start gap-2 mb-2 p-2 bg-amber-50 rounded text-sm">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-900">{source.notes}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {source.retailers.map((retailer, rIndex) => (
                <Button
                  key={rIndex}
                  variant={rIndex === 0 && retailer === 'HD Supply' ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs ${
                    rIndex === 0 && retailer === 'HD Supply' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white font-semibold' 
                      : ''
                  }`}
                  onClick={() => window.open(getRetailerUrl(retailer, source.part), '_blank')}
                >
                  {retailer}
                  {rIndex === 0 && retailer === 'HD Supply' && (
                    <span className="ml-1 text-xs">★</span>
                  )}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>

          </div>
        ))}
      </div>
    </Card>
  );
}
