import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Droplet,
  ThermometerSun,
  Zap,
  Refrigerator,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    title: 'Plumbing',
    icon: Droplet,
    color: 'plumbing',
    description: 'Clogs, leaks, no hot water',
    to: '/knowledge-base?category=plumbing',
  },
  {
    title: 'HVAC',
    icon: ThermometerSun,
    color: 'hvac',
    description: 'No cooling, strange noises',
    to: '/knowledge-base?category=hvac',
  },
  {
    title: 'Electrical',
    icon: Zap,
    color: 'electrical',
    description: 'Outlets, breakers, lights',
    to: '/knowledge-base?category=electrical',
  },
  {
    title: 'Appliances',
    icon: Refrigerator,
    color: 'appliance',
    description: 'Fridge, washer, disposal',
    to: '/knowledge-base?category=appliance',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.email?.split('@')[0] || 'Tech';

  return (
    <>
      {/* Sidebar is automatically included via your page wrapper */}
      <main className="lg:ml-72 pt-14 lg:pt-0 min-h-screen bg-background pb-20">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Good morning, {firstName} 👋
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              What are we fixing in student housing today?
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-semibold">12</p>
                  <p className="text-sm text-muted-foreground">Calls today</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-hvac/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-hvac" />
                </div>
                <div>
                  <p className="text-3xl font-semibold">4m</p>
                  <p className="text-sm text-muted-foreground">Avg fix time</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 col-span-2 lg:col-span-1">
              <Badge variant="secondary" className="mb-3">
                ON TRACK
              </Badge>
              <p className="text-3xl font-semibold">87%</p>
              <p className="text-sm text-muted-foreground">First-call resolution</p>
            </Card>
          </div>

          {/* Category Cards */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">Choose a category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.title} to={cat.to}>
                    <Card
                      className={`group h-full p-8 transition-all hover:scale-[1.02] hover:shadow-xl border-2 hover:border-current ${cat.color}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 bg-white/10`}>
                            <Icon className="w-9 h-9 text-white" />
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-2">{cat.title}</h3>
                          <p className="text-white/80 text-lg">{cat.description}</p>
                        </div>
                        <Button
                          size="lg"
                          variant="secondary"
                          className="bg-white text-black group-hover:bg-white/90"
                        >
                          Start →
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Recent Diagnostics</h2>
              <Button variant="outline" asChild>
                <Link to="/knowledge-base">View all</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {[
                { time: '11 min ago', unit: 'Unit 204B', issue: 'Shower drain clog', category: 'plumbing' },
                { time: '47 min ago', unit: 'The Lofts 316', issue: 'AC not cooling', category: 'hvac' },
                { time: '2 hrs ago', unit: 'Campus View 112', issue: 'GFCI outlet tripping', category: 'electrical' },
              ].map((item, i) => (
                <Card key={i} className="p-5 flex items-center gap-5 hover:bg-muted/50 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${item.category}`} />
                  <div className="flex-1">
                    <p className="font-medium">{item.issue}</p>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{item.time}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
