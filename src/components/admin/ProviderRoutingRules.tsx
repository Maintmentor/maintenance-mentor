import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { translationProviderService, RoutingRule, TranslationProvider } from '@/services/translationProviderService';
import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderRoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [providers, setProviders] = useState<TranslationProvider[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    priority: 0,
    source_language: '',
    target_language: '',
    preferred_provider_id: '',
    routing_strategy: 'balanced' as const,
    is_enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesData, providersData] = await Promise.all([
        translationProviderService.getRoutingRules(),
        translationProviderService.getProviders()
      ]);
      setRules(rulesData);
      setProviders(providersData);
    } catch (error) {
      toast.error('Failed to load routing rules');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await translationProviderService.updateRoutingRule(editingRule.id, formData);
        toast.success('Rule updated');
      } else {
        await translationProviderService.createRoutingRule(formData);
        toast.success('Rule created');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 0,
      source_language: '',
      target_language: '',
      preferred_provider_id: '',
      routing_strategy: 'balanced',
      is_enabled: true
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: RoutingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      priority: rule.priority,
      source_language: rule.source_language || '',
      target_language: rule.target_language || '',
      preferred_provider_id: rule.preferred_provider_id || '',
      routing_strategy: rule.routing_strategy,
      is_enabled: rule.is_enabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this routing rule?')) {
      try {
        await translationProviderService.deleteRoutingRule(id);
        toast.success('Rule deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete rule');
      }
    }
  };

  const getProviderName = (id?: string) => {
    if (!id) return 'Auto';
    return providers.find(p => p.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Routing Rules</h2>
          <p className="text-muted-foreground">Configure provider selection logic</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit' : 'Create'} Routing Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Language</Label>
                  <Input
                    value={formData.source_language}
                    onChange={(e) => setFormData({ ...formData, source_language: e.target.value })}
                    placeholder="en (optional)"
                  />
                </div>
                <div>
                  <Label>Target Language</Label>
                  <Input
                    value={formData.target_language}
                    onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                    placeholder="es (optional)"
                  />
                </div>
              </div>
              <div>
                <Label>Preferred Provider</Label>
                <Select
                  value={formData.preferred_provider_id}
                  onValueChange={(value) => setFormData({ ...formData, preferred_provider_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-select</SelectItem>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Routing Strategy</Label>
                <Select
                  value={formData.routing_strategy}
                  onValueChange={(value: any) => setFormData({ ...formData, routing_strategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost">Lowest Cost</SelectItem>
                    <SelectItem value="quality">Highest Quality</SelectItem>
                    <SelectItem value="speed">Fastest</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority (higher = first)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
                <Label>Enabled</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingRule ? 'Update' : 'Create'} Rule
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={rule.is_enabled ? 'default' : 'secondary'}>
                      {rule.is_enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">Priority: {rule.priority}</Badge>
                    <Badge variant="outline">{rule.routing_strategy}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {rule.source_language || 'Any'} <ArrowRight className="inline h-4 w-4 mx-1" /> {rule.target_language || 'Any'}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{getProviderName(rule.preferred_provider_id)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
