import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import { googleSheetsService } from '@/services/googleSheetsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function GoogleSheetsCard() {
  const { user } = useAuth();
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSheet();
  }, [user]);

  const loadSheet = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await googleSheetsService.getUserSheet(user.id);
      setSheet(data);
    } catch (error) {
      console.error('Error loading sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!user?.id || !user?.email) return;
    
    setCreating(true);
    try {
      const newSheet = await googleSheetsService.createUserSheet(
        user.id,
        user.email,
        user.user_metadata?.full_name || user.email
      );
      setSheet(newSheet);
      toast.success('Your personal repair log has been created!');
    } catch (error: any) {
      toast.error('Failed to create sheet: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Repair Query Log
            </CardTitle>
            <CardDescription>
              All your repair queries are automatically logged to Google Sheets
            </CardDescription>
          </div>
          {sheet && (
            <Badge variant="default">
              {sheet.query_count} queries logged
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sheet ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Sheet Name</div>
              <div className="font-medium">{sheet.sheet_name}</div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(sheet.spreadsheet_url, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Google Sheets
              </Button>
              <Button
                onClick={loadSheet}
                variant="outline"
              >
                Refresh
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(sheet.last_updated).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Create your personal repair log to track all your queries in Google Sheets
            </p>
            <Button onClick={handleCreateSheet} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create My Repair Log
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
