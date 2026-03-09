import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface KnowledgeBaseSearchProps {
  onSearch: (query: string) => void;
}

export default function KnowledgeBaseSearch({ onSearch }: KnowledgeBaseSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search articles, FAQs, and guides..."
          value={query}
          onChange={handleChange}
          className="pl-12 pr-4 py-6 text-lg bg-white border-2 border-transparent focus:border-white rounded-xl shadow-lg"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['leaking faucet', 'AC not cooling', 'circuit breaker', 'water heater'].map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </form>
  );
}
