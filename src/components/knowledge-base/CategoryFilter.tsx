import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wind, Droplet, Zap, Wrench, Hammer, Thermometer } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  selectedType: string;
  onCategoryChange: (category: string) => void;
  onTypeChange: (type: string) => void;
}

const categories = [
  { id: 'all', label: 'All Categories', icon: Hammer },
  { id: 'HVAC', label: 'HVAC', icon: Wind },
  { id: 'Plumbing', label: 'Plumbing', icon: Droplet },
  { id: 'Electrical', label: 'Electrical', icon: Zap },
  { id: 'Appliances', label: 'Appliances', icon: Thermometer },
  { id: 'General', label: 'General', icon: Wrench },
];

const types = [
  { id: 'all', label: 'All Types' },
  { id: 'article', label: 'Articles' },
  { id: 'video', label: 'Videos' },
  { id: 'faq', label: 'FAQs' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export default function CategoryFilter({
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
}: CategoryFilterProps) {
  return (
    <Card className="p-6 sticky top-4">
      <h3 className="font-semibold text-lg mb-4">Categories</h3>
      <div className="space-y-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onCategoryChange(cat.id)}
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      <Separator className="my-6" />

      <h3 className="font-semibold text-lg mb-4">Content Type</h3>
      <div className="space-y-2">
        {types.map((type) => (
          <Button
            key={type.id}
            variant={selectedType === type.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onTypeChange(type.id)}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
