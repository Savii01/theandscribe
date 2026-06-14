import React from 'react';

/**
 * Layout wrapping all auth routes (login, register, reset-password).
 * Ensures full-screen background and consistent styling.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden">
      {children}
    </div>
  );
}
