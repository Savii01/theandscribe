'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BottomTabBar } from './BottomTabBar';

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Shell component that encapsulates navigation and layout zones.
 * Wraps dashboard routes with responsive navigation bars.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar (Desktop Only) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8 focus:outline-none animate-fade-up">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <BottomTabBar />
      </div>
    </div>
  );
}
export default DashboardShell;
