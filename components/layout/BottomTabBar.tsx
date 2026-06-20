'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FaHome, FaUpload, FaFileAlt, FaSearch, FaCog, FaShieldAlt } from 'react-icons/fa';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabItems: TabItem[] = [
  { label: 'Home', href: '/dashboard', icon: FaHome },
  { label: 'Upload', href: '/upload', icon: FaUpload },
  { label: 'Files', href: '/transcripts', icon: FaFileAlt },
  { label: 'Search', href: '/search', icon: FaSearch },
  { label: 'Settings', href: '/settings', icon: FaCog },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    }
    checkRole();
  }, [supabase]);

  const activeTabs = [...tabItems];
  if (isAdmin) {
    activeTabs.push({ label: 'Admin', href: '/admin', icon: FaShieldAlt });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe z-30">
      {activeTabs.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium gap-1 transition-colors duration-150',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-xl transition',
              isActive ? 'bg-primary/10' : 'bg-transparent'
            )}>
              <Icon className="text-lg" />
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
export default BottomTabBar;
