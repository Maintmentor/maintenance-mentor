import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  CreditCard,
  User,
  Wrench,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // your existing context

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/video-library', icon: Video, label: 'Video Library' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sidebar-foreground">
              FixTech
            </h1>
            <p className="text-xs text-sidebar-foreground/60 -mt-1">Student Housing</p>
          </div>
        </div>
      </div>

      {/* New Diagnostic Button */}
      <div className="px-6 pt-6 pb-4">
        <Button
          asChild
          className="w-full justify-start text-base font-semibold h-12 plumbing"
          onClick={() => setMobileOpen(false)}
        >
          <NavLink to="/knowledge-base">
            <Wrench className="mr-3 h-5 w-5" />
            Start New Diagnostic
          </NavLink>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 mx-3 rounded-2xl text-sm font-medium transition-all mb-1 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-sidebar-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            logout?.();
            setMobileOpen(false);
          }}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col h-screen fixed top-0 left-0 z-50 bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">FixTech</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* MOBILE OVERLAY MENU */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-[60] flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="bg-sidebar w-72 h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
