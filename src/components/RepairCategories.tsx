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
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758040681410_cafcca40.webp',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'electrical',
    title: 'Electrical',
    description: 'Outlets, switches, lighting, and electrical troubleshooting',
    icon: Zap,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758040682148_9f873ce6.webp',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'plumbing',
    title: 'Plumbing',
    description: 'Faucets, toilets, pipes, leaks, and water system issues',
    icon: Droplets,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758040682922_4db45e83.webp',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'appliances',
    title: 'Appliances',
    description: 'Washers, dryers, refrigerators, and kitchen appliances',
    icon: Wrench,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758040688477_9a74a1d3.webp',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'pool-maintenance',
    title: 'Pool Maintenance',
    description: 'Pool cleaning, chemical balancing, equipment servicing',
    icon: Waves,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758909023739_545e645b.webp',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'water-systems',
    title: 'Water Systems',
    description: 'Domestic water, high-rise buildings, filtration systems',
    icon: Building,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758909028101_82fbc0f2.webp',
    color: 'from-teal-500 to-cyan-600'
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
      // Handle other categories
      console.log(`Selected category: ${categoryId}`);
    }
  };

  const handlePoolServiceSelect = (service: any) => {
    console.log('Selected pool service:', service);
    // Here you would typically navigate to a service details page or start the service
  };

  const handleWaterServiceSelect = (service: any) => {
    console.log('Selected water service:', service);
    // Here you would typically navigate to a service details page or schedule the service
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
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-80 group-hover:opacity-70 transition-opacity`}></div>
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