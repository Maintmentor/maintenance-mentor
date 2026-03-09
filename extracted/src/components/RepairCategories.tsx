import React, { useState } from 'react';
import { Wind, Zap, Droplets, Wrench, Waves, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import PoolMaintenanceCard from './PoolMaintenanceCard';
import WaterSystemCard from './WaterSystemCard';

const categories = [
  {
    id: 'hvac',
    title: 'HVAC Systems',
    description: 'Air conditioning, heating, ventilation repairs and maintenance',
    icon: Wind,
    color: 'from-blue-500 to-blue-600',
    bgPattern: 'from-blue-50 to-blue-100'
  },
  {
    id: 'electrical',
    title: 'Electrical',
    description: 'Outlets, switches, lighting, and electrical troubleshooting',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    bgPattern: 'from-yellow-50 to-orange-50'
  },
  {
    id: 'plumbing',
    title: 'Plumbing',
    description: 'Faucets, toilets, pipes, leaks, and water system issues',
    icon: Droplets,
    color: 'from-blue-400 to-cyan-500',
    bgPattern: 'from-blue-50 to-cyan-50'
  },
  {
    id: 'appliances',
    title: 'Appliances',
    description: 'Washers, dryers, refrigerators, and kitchen appliances',
    icon: Wrench,
    color: 'from-purple-500 to-pink-500',
    bgPattern: 'from-purple-50 to-pink-50'
  },
  {
    id: 'pool-maintenance',
    title: 'Pool Maintenance',
    description: 'Pool cleaning, chemical balancing, equipment servicing',
    icon: Waves,
    color: 'from-cyan-500 to-blue-500',
    bgPattern: 'from-cyan-50 to-blue-50'
  },
  {
    id: 'water-systems',
    title: 'Water Systems',
    description: 'Domestic water, high-rise buildings, filtration systems',
    icon: Building,
    color: 'from-teal-500 to-cyan-600',
    bgPattern: 'from-teal-50 to-cyan-50'
  }
];

const RepairCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPoolMaintenance, setShowPoolMaintenance] = useState(false);
  const [showWaterSystems, setShowWaterSystems] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'pool-maintenance') {
      setShowPoolMaintenance(true);
    } else if (categoryId === 'water-systems') {
      setShowWaterSystems(true);
    } else {
      console.log(`Selected category: ${categoryId}`);
    }
  };

  const handlePoolServiceSelect = (service: any) => {
    console.log('Selected pool service:', service);
  };

  const handleWaterServiceSelect = (service: any) => {
    console.log('Selected water service:', service);
  };

  return (
    <>
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Expert Repair Guidance for Every Issue
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI troubleshoots your repair needs and provides step-by-step instructions 
              as well as custom videos for hundreds of common residential and commercial issues.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div 
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                >
                  <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${category.color}`}>
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`pattern-${category.id}`} width="30" height="30" patternUnits="userSpaceOnUse">
                            <circle cx="15" cy="15" r="2" fill="white" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#pattern-${category.id})`} />
                      </svg>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IconComponent className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pool Maintenance Modal */}
      <Dialog open={showPoolMaintenance} onOpenChange={setShowPoolMaintenance}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Pool Maintenance Services</DialogTitle>
          <div className="mt-4">
            <PoolMaintenanceCard onServiceSelect={handlePoolServiceSelect} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Water Systems Modal */}
      <Dialog open={showWaterSystems} onOpenChange={setShowWaterSystems}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Water System Services</DialogTitle>
          <div className="mt-4">
            <WaterSystemCard onServiceSelect={handleWaterServiceSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RepairCategories;
