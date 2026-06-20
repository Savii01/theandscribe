'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/lib/store/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  FaHome,
  FaUpload,
  FaFileAlt,
  FaSearch,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
} from 'react-icons/fa';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaHome },
  { label: 'New Transcript', href: '/upload', icon: FaUpload },
  { label: 'Transcripts', href: '/transcripts', icon: FaFileAlt },
  { label: 'Search', href: '/search', icon: FaSearch },
  { label: 'Settings', href: '/settings', icon: FaCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const logoSrc = themeMounted && resolvedTheme === 'light'
    ? '/Logo/logo_light_theme_navbar.svg'
    : '/Logo/logo_dark_theme_navbar.svg';

  const [user, setUser] = useState<{ email?: string; full_name?: string; avatar_url?: string; role?: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile details
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('id', user.id)
          .single();

        setUser({
          email: user.email,
          full_name: profile?.full_name || '',
          avatar_url: profile?.avatar_url || '',
          role: profile?.role || 'user',
        });
      }
    }
    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (error: any) {
      toast.error('Failed to sign out');
      console.error(error);
    }
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen border-r border-border bg-background transition-all duration-300 relative z-20',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Sidebar Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute right-[-12px] top-6 w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none z-30"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
      </button>

      {/* Header / Logo */}
      <div className={cn('flex items-center h-14 px-4 border-b border-border', sidebarOpen ? 'justify-between' : 'justify-center')}>
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
          {themeMounted && (
            <img
              src={logoSrc}
              alt="theandscribe logo"
              className="w-8 h-8 min-w-[32px] rounded-lg select-none"
            />
          )}
          {sidebarOpen && (
            <span className="font-heading font-bold text-lg tracking-tight truncate">
              theandscribe
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition duration-150 relative group',
                isActive
                  ? 'bg-accent-muted text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              )}
            >
              <Icon className={cn('text-lg min-w-[20px]', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-zinc-950 text-white text-xs py-1 px-2.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
        
        {user?.role === 'admin' && (() => {
          const isActive = pathname === '/admin' || pathname.startsWith('/admin/');
          return (
            <Link
              key="/admin"
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition duration-150 relative group',
                isActive
                  ? 'bg-accent-muted text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              )}
            >
              <FaShieldAlt className={cn('text-lg min-w-[20px]', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {sidebarOpen && <span className="truncate">Admin Panel</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-zinc-950 text-white text-xs py-1 px-2.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                  Admin Panel
                </div>
              )}
            </Link>
          );
        })()}
      </nav>

      {/* User / Footer section */}
      <div className="p-3 border-t border-border space-y-3 bg-zinc-950/20">
        <div className={cn('flex items-center gap-3', sidebarOpen ? 'justify-between' : 'justify-center')}>
          <div className="flex items-center gap-3 overflow-hidden">
            {/* User Avatar */}
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 min-w-[32px] rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-xs text-primary">
                {getInitials()}
              </div>
            )}

            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate text-foreground">
                  {user?.full_name || 'theandscribe User'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-red-500 transition cursor-pointer p-1 rounded-lg hover:bg-muted focus:outline-none"
              aria-label="Sign out"
            >
              <FaSignOutAlt />
            </button>
          )}
        </div>

        {/* System Settings (ThemeToggle etc) */}
        {sidebarOpen ? (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">Appearance</span>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex justify-center pt-1">
            <ThemeToggle />
          </div>
        )}

        {!sidebarOpen && (
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center text-muted-foreground hover:text-red-500 transition cursor-pointer p-2 rounded-xl hover:bg-muted focus:outline-none"
            aria-label="Sign out"
          >
            <FaSignOutAlt />
          </button>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
