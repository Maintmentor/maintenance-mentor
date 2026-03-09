import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, Camera, Tag, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RepairHistory {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  cost_estimate: number;
  actual_cost: number;
  difficulty_level: number;
  time_spent: number;
  completion_date: string;
  photos: string[];
  notes: string;
  tags: string[];
}

interface RepairHistoryListProps {
  onSelectRepair: (repair: RepairHistory) => void;
}

export default function RepairHistoryList({ onSelectRepair }: RepairHistoryListProps) {
  const [repairs, setRepairs] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRepairHistory();
    }
  }, [user]);

  const fetchRepairHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_history')
        .select('*')
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setRepairs(data || []);
    } catch (error) {
      console.error('Error fetching repair history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading repair history...</div>;
  }

  return (
    <div className="space-y-4">
      {repairs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No repair history yet. Complete your first repair to see it here!</p>
          </CardContent>
        </Card>
      ) : (
        repairs.map((repair) => (
          <Card key={repair.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectRepair(repair)}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{repair.title}</CardTitle>
                <Badge variant="outline" className={getDifficultyColor(repair.difficulty_level)}>
                  Level {repair.difficulty_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">{repair.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(repair.completion_date).toLocaleDateString()}
                </div>
                {repair.actual_cost && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${repair.actual_cost.toFixed(2)}
                  </div>
                )}
                {repair.time_spent && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(repair.time_spent / 60)}h {repair.time_spent % 60}m
                  </div>
                )}
                {repair.photos?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    {repair.photos.length} photos
                  </div>
                )}
              </div>

              {repair.tags && repair.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {repair.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}