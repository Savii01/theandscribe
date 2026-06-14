import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

/**
 * Route layout wrapping all dashboard pages.
 * Ensures the side menu, top header, and mobile bottom tab bar are applied to all sub-routes.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
