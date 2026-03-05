import { Card } from '@/components/ui/card';
import { Wrench, Zap, Wind, Droplets, Home, Waves, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ServiceCategory {
  id: string;
  title: string;
  icon: any;
  image: string;
  description: string;
  color: string;
  activeRequests?: number;
}

const defaultServices: ServiceCategory[] = [
  {
    id: 'plumbing',
    title: 'Plumbing',
    icon: Wrench,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600519560_d0b24fe6.webp',
    description: 'Expert plumbing repairs and installations',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'electrical',
    title: 'Electrical',
    icon: Zap,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600520312_b8d866fb.webp',
    description: 'Professional electrical services and wiring',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'hvac',
    title: 'HVAC',
    icon: Wind,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600521036_ca38a8d6.webp',
    description: 'Heating, cooling, and ventilation systems',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'water-systems',
    title: 'Water Systems',
    icon: Droplets,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600522031_043a6ace.webp',
    description: 'Water filtration and treatment solutions',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'appliances',
    title: 'Appliances',
    icon: Home,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600523062_8a7c9eb4.webp',
    description: 'Appliance repair and maintenance',
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'swimming-pools',
    title: 'Swimming Pools',
    icon: Waves,
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759600524078_24047485.webp',
    description: 'Pool maintenance and repair services',
    color: 'from-blue-500 to-teal-500'
  }
];

export default function ServiceCategories() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceCategory[]>(defaultServices);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveRequests();
    }
  }, [user]);

  const loadActiveRequests = async () => {
    if (!user) return;
    
    try {
      // Get count of active service requests per category
      const { data, error } = await supabase
        .from('service_requests')
        .select('category')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress']);

      if (!error && data) {
        const requestCounts = data.reduce((acc: Record<string, number>, req) => {
          const category = req.category.toLowerCase().replace(' ', '-');
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        setServices(prevServices => 
          prevServices.map(service => ({
            ...service,
            activeRequests: requestCounts[service.id] || 0
          }))
        );
      }
    } catch (error) {
      console.error('Error loading active requests:', error);
    }
  };

  const handleServiceClick = async (serviceId: string) => {
    setSelectedService(serviceId);
    
    if (user) {
      // Create a new service request
      try {
        setLoading(true);
        const service = services.find(s => s.id === serviceId);
        
        const { error } = await supabase
          .from('service_requests')
          .insert([{
            user_id: user.id,
            title: `${service?.title} Service Request`,
            category: service?.title || serviceId,
            description: `Request for ${service?.description}`,
            status: 'pending',
            priority: 'medium'
          }]);

        if (!error) {
          toast.success('Service request created successfully!');
          loadActiveRequests(); // Reload counts
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error creating service request:', error);
        toast.error('Failed to create service request');
      } finally {
        setLoading(false);
      }
    } else {
      // Scroll to features for non-logged in users
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert solutions for all your apartment maintenance needs
          </p>
          {user && (
            <p className="text-sm text-blue-600 mt-2">
              Click on a service to create a new request
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  selectedService === service.id ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60 group-hover:opacity-40 transition-opacity`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-16 h-16 text-white drop-shadow-lg" />
                  </div>
                  {service.activeRequests && service.activeRequests > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                      {service.activeRequests} Active
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                  {loading && selectedService === service.id && (
                    <div className="mt-4 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
