import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { User, Plus, Settings, Trash2, Globe, Mic, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface VoiceProfileManagerProps {
  profiles: any[];
  activeProfile: any;
  onProfileChange: (profile: any) => void;
}

export function VoiceProfileManager({ profiles, activeProfile, onProfileChange }: VoiceProfileManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    profile_name: '',
    accent_type: '',
    language: 'en-US',
    custom_vocabulary: ''
  });
  const { toast } = useToast();

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
    { value: 'zh-CN', label: 'Chinese (Mandarin)' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' }
  ];

  const accents = [
    'Standard American',
    'British',
    'Australian',
    'Canadian',
    'Southern US',
    'New York',
    'Boston',
    'Midwestern',
    'Texas',
    'California',
    'Other'
  ];

  const createProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const customVocab = formData.custom_vocabulary
        .split('\n')
        .filter(word => word.trim())
        .map(word => word.trim());

      const { data, error } = await supabase
        .from('voice_training_profiles')
        .insert({
          user_id: user.id,
          profile_name: formData.profile_name,
          accent_type: formData.accent_type,
          language: formData.language,
          custom_vocabulary: customVocab,
          is_active: profiles.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profile Created",
        description: "Your voice profile has been created successfully."
      });

      setIsCreating(false);
      setFormData({
        profile_name: '',
        accent_type: '',
        language: 'en-US',
        custom_vocabulary: ''
      });
      onProfileChange(data);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create voice profile.",
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (profileId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('voice_training_profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your voice profile has been updated."
      });

      onProfileChange({ ...activeProfile, ...updates });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    }
  };

  const setActiveProfile = async (profileId: string) => {
    try {
      // Deactivate all profiles
      await supabase
        .from('voice_training_profiles')
        .update({ is_active: false })
        .neq('id', profileId);

      // Activate selected profile
      await supabase
        .from('voice_training_profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      const profile = profiles.find(p => p.id === profileId);
      onProfileChange(profile);

      toast({
        title: "Profile Activated",
        description: `${profile.profile_name} is now your active profile.`
      });
    } catch (error) {
      console.error('Error setting active profile:', error);
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('voice_training_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Profile Deleted",
        description: "Voice profile has been deleted."
      });

      onProfileChange(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className={profile.is_active ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {profile.profile_name}
                </span>
                {profile.is_active && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{languages.find(l => l.value === profile.language)?.label || profile.language}</span>
              </div>
              
              {profile.accent_type && (
                <div className="flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.accent_type}</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <span>Sessions: {profile.training_sessions_completed || 0}</span>
                <span className="mx-2">•</span>
                <span>Accuracy: {profile.accuracy_score || 0}%</span>
              </div>

              <div className="flex gap-2 pt-2">
                {!profile.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveProfile(profile.id)}
                  >
                    Set Active
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Profile Name</Label>
                        <Input
                          value={editingProfile?.profile_name || profile.profile_name}
                          onChange={(e) => setEditingProfile({ ...profile, profile_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Custom Vocabulary</Label>
                        <Textarea
                          placeholder="Enter repair-specific terms, one per line"
                          value={editingProfile?.custom_vocabulary?.join('\n') || profile.custom_vocabulary?.join('\n')}
                          onChange={(e) => setEditingProfile({ 
                            ...profile, 
                            custom_vocabulary: e.target.value.split('\n').filter(w => w.trim()) 
                          })}
                        />
                      </div>
                      <Button onClick={() => {
                        updateProfile(profile.id, editingProfile || profile);
                        setEditingProfile(null);
                      }}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteProfile(profile.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Profile Card */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <Plus className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="text-muted-foreground">Create New Profile</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Voice Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Profile Name</Label>
                <Input
                  placeholder="e.g., Work Profile, Home Profile"
                  value={formData.profile_name}
                  onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Accent Type (Optional)</Label>
                <Select
                  value={formData.accent_type}
                  onValueChange={(value) => setFormData({ ...formData, accent_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your accent" />
                  </SelectTrigger>
                  <SelectContent>
                    {accents.map((accent) => (
                      <SelectItem key={accent} value={accent}>
                        {accent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Vocabulary (Optional)</Label>
                <Textarea
                  placeholder="Enter repair-specific terms, one per line"
                  value={formData.custom_vocabulary}
                  onChange={(e) => setFormData({ ...formData, custom_vocabulary: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={createProfile} className="w-full">
                Create Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}