'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon } from 'react-icons/fa';

/**
 * Accessible button to toggle between light and dark mode.
 * Styled with yellow highlight/borders and Satoshi typography.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-tertiary border border-border animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-xl bg-tertiary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <FaSun className="text-primary text-sm" />
      ) : (
        <FaMoon className="text-primary text-sm" />
      )}
    </button>
  );
}
