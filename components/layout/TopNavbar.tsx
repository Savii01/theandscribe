'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usageCount, dailyLimit, isLoading } = useDailyUsage();

  // Determine the page title based on the path
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/upload') return 'New Transcript';
    if (pathname === '/transcripts') return 'Transcripts';
    if (pathname === '/search') return 'Search';
    if (pathname === '/settings') return 'Settings';
    if (pathname.match(/^\/transcripts\/[^\/]+\/edit$/)) return 'Edit Transcript';
    if (pathname.match(/^\/transcripts\/[^\/]+$/)) return 'Transcript Detail';
    return 'theandscribe';
  };

  const isUploadPage = pathname === '/upload';
  const percentUsed = (usageCount / dailyLimit) * 100;

  return (
    <header className="h-14 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      {/* Left: Page Title */}
      <h1 className="font-heading font-bold text-lg tracking-tight text-foreground">
        {getPageTitle()}
      </h1>

      {/* Right: Usage Pill & Actions */}
      <div className="flex items-center gap-4">
        {/* Usage Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
          <span className="text-muted-foreground">Daily Transcriptions:</span>
          {isLoading ? (
            <FaSpinner className="animate-spin text-primary" size={10} />
          ) : (
            <span className="font-semibold text-primary">
              {usageCount}/{dailyLimit}
            </span>
          )}
          
          {/* Status Indicator Dot */}
          <div className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 70 ? 'bg-orange-500' : 'bg-primary'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 70 ? 'bg-orange-500' : 'bg-primary'
              }`}
            />
          </div>
        </div>

        {/* CTA: New Transcript Button (hidden on upload page) */}
        {!isUploadPage && (
          <Link
            href="/upload"
            className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary hover:bg-accent-hover text-black font-semibold text-sm transition duration-150"
          >
            <FaPlus size={10} />
            <span>New Transcript</span>
          </Link>
        )}
      </div>
    </header>
  );
}
export default TopNavbar;
