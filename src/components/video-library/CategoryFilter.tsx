import React from 'react';
import { Wrench, Zap, Refrigerator, Wind, Settings, Grid3X3 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'all': return Grid3X3;
    case 'plumbing': return Wrench;
    case 'electrical': return Zap;
    case 'appliances': return Refrigerator;
    case 'hvac': return Wind;
    case 'general': return Settings;
    default: return Settings;
  }
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
      
      <div className="space-y-2">
        {categories.map((category) => {
          const IconComponent = getCategoryIcon(category.id);
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">{category.name}</span>
              </div>
              
              <span className={`text-sm px-2 py-1 rounded-full ${
                isSelected 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Videos</span>
            <span className="font-medium">6</span>
          </div>
          <div className="flex justify-between">
            <span>Watch Time</span>
            <span className="font-medium">1.2 hrs</span>
          </div>
          <div className="flex justify-between">
            <span>Completed</span>
            <span className="font-medium">1</span>
          </div>
        </div>
      </div>
    </div>
  );
};