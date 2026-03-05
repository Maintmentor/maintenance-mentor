import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  LayoutDashboard,
  History,
  Package,
  Bell,
  FileText,
  BarChart3,
  Wrench,
  Image,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Team Chat' },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
