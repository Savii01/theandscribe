
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FaGoogle, FaEye, FaEyeSlash, FaSpinner, FaKeyboard } from 'react-icons/fa';
import Link from 'next/link';

import { useTheme } from 'next-themes';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const logoSrc = themeMounted && resolvedTheme === 'light'
    ? '/Logo/logo_light_theme_navbar.svg'
    : '/Logo/logo_dark_theme_navbar.svg';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check for errors or messages in URL params (e.g. from callback or reset password redirects)
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    const message = searchParams.get('message');
    if (errorMsg) {
      toast.error(errorMsg);
    }
    if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Successfully logged in!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error('Failed to initiate Google sign-in');
      console.error(err);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column (55%): Branding + Features */}
      <div className="hidden md:flex md:w-[55%] bg-zinc-950 text-white flex-col justify-between p-12 relative border-r border-zinc-900 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-yellow-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-yellow-500/5 blur-[120px]" />

        {/* Branding header */}
        <Link href="/" className="flex items-center space-x-3 z-10 hover:opacity-80 transition-opacity">
          <img
            src="/Logo/logo_dark_theme_navbar.svg"
            alt="theandscribe logo"
            className="w-10 h-10 rounded-lg select-none"
          />
          <span className="font-heading font-bold text-xl tracking-tight text-white">
            theandscribe
          </span>
        </Link>

        {/* Main message */}
        <div className="my-auto max-w-lg z-10">
          <h1 className="text-4xl lg:text-5xl font-heading font-bold tracking-tightest leading-tight text-white mb-6">
            Transcribe and repurpose media in <span className="text-primary">seconds</span>.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Your personal, zero-cost workspace. Convert audio and video to accurate text, then instantly generate summaries, blog posts, and meeting notes powered by Groq LLaMA 3.3.
          </p>

          {/* Feature Pills */}
          <div className="space-y-4">
            <div className="flex items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
              <span className="text-primary mr-3 text-lg">⚡</span>
              <span className="text-sm font-medium text-zinc-200">
                Ultra-fast Groq Whisper transcription (under 15s)
              </span>
            </div>
            <div className="flex items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
              <span className="text-primary mr-3 text-lg">🧠</span>
              <span className="text-sm font-medium text-zinc-200">
                AI post-processing (Summaries, Action Items, Chapters)
              </span>
            </div>
            <div className="flex items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
              <span className="text-primary mr-3 text-lg">📄</span>
              <span className="text-sm font-medium text-zinc-200">
                Streamlined export to 5 formats (DOCX, PDF, SRT, VTT, TXT)
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-zinc-500 text-xs z-10 flex justify-between">
          <span>&copy; {new Date().getFullYear()} theandscribe</span>
          <span className="flex items-center gap-1.5">
            <FaKeyboard className="text-zinc-500" /> Keyboard accessible workspace
          </span>
        </div>
      </div>

      {/* Right Column (45%): Sign In Form */}
      <div className="w-full md:w-[45%] bg-background text-foreground flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="flex items-center space-x-3 mb-6 md:hidden hover:opacity-80 transition-opacity">
              {themeMounted && (
                <img
                  src={logoSrc}
                  alt="theandscribe logo"
                  className="w-8 h-8 rounded-lg select-none"
                />
              )}
              <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                theandscribe
              </span>
            </Link>
            <h2 className="text-3xl font-heading font-bold tracking-tighter text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your transcriptions
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            type="button"
            className="w-full h-11 flex items-center justify-center gap-3 border border-border hover:bg-muted font-medium text-sm rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <FaSpinner className="animate-spin text-zinc-400" />
            ) : (
              <FaGoogle className="text-red-500" />
            )}
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Or email sign in
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading || googleLoading}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-tertiary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-medium text-primary hover:text-accent-hover transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading || googleLoading}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-tertiary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition focus:outline-none cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <FaSpinner className="animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-accent-hover transition underline decoration-2 decoration-primary/30 hover:decoration-primary"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <FaSpinner className="animate-spin text-primary" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
