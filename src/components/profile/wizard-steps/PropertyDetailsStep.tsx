import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PropertyDetailsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function PropertyDetailsStep({ data, onUpdate }: PropertyDetailsStepProps) {
  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Property Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tell us about your property to get better service recommendations.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_type">Property Type</Label>
        <Select
          value={data.property_type || ''}
          onValueChange={(value) => handleChange('property_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="mobile_home">Mobile Home</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_size">Property Size (sq ft)</Label>
        <Input
          id="property_size"
          type="number"
          placeholder="1500"
          value={data.property_size || ''}
          onChange={(e) => handleChange('property_size', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="year_built">Year Built</Label>
        <Input
          id="year_built"
          type="number"
          placeholder="2000"
          min="1800"
          max={new Date().getFullYear()}
          value={data.year_built || ''}
          onChange={(e) => handleChange('year_built', e.target.value)}
        />
      </div>
    </div>
  );
}
