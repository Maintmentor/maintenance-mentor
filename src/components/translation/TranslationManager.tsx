import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { translationService } from '@/services/translationService';
import { SUPPORTED_LANGUAGES } from '@/services/languageService';
import { Languages, Save, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TranslationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    sourceLanguage: 'auto',
    targetLanguage: 'en-US',
    autoTranslateEnabled: true,
    translateAiResponses: true
  });
  const [stats, setStats] = useState({ totalEntries: 0, totalUses: 0, cacheHitRate: 0 });

  useEffect(() => {
    loadPreferences();
    loadStats();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const prefs = await translationService.getPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const cacheStats = await translationService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await translationService.updatePreferences(user.id, preferences);
      toast({
        title: 'Settings Saved',
        description: 'Translation preferences updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translation Settings
          </CardTitle>
          <CardDescription>
            Configure automatic translation for voice input and AI responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-lang">Your Language</Label>
              <Select
                value={preferences.sourceLanguage}
                onValueChange={(value) => setPreferences({ ...preferences, sourceLanguage: value })}
              >
                <SelectTrigger id="source-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-translate Voice Input</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate your speech to English for AI processing
                </p>
              </div>
              <Switch
                checked={preferences.autoTranslateEnabled}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, autoTranslateEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Translate AI Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Translate AI responses back to your language
                </p>
              </div>
              <Switch
                checked={preferences.translateAiResponses}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, translateAiResponses: checked })
                }
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Translation Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Cached Translations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalUses}</div>
              <div className="text-sm text-muted-foreground">Total Uses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
