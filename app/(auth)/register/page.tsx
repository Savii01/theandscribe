'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FaGoogle, FaEye, FaEyeSlash, FaSpinner, FaKeyboard } from 'react-icons/fa';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Evaluate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    setPasswordStrength(score);
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength < 2) {
      toast.error('Please choose a stronger password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Registration successful! Please check your email to verify your account.');
        router.push('/login?message=Verification email sent. Please check your inbox.');
      }
    } catch (err: any) {
      toast.error('Registration failed. Please try again.');
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

  // Get strength styling
  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return { text: 'Weak', color: 'bg-red-500' };
      case 2: return { text: 'Fair', color: 'bg-orange-500' };
      case 3: return { text: 'Good', color: 'bg-yellow-500' };
      case 4: return { text: 'Strong', color: 'bg-green-500' };
      default: return { text: 'None', color: 'bg-zinc-800' };
    }
  };

  const strength = getStrengthLabel();

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column (55%): Branding + Features */}
      <div className="hidden md:flex md:w-[55%] bg-zinc-950 text-white flex-col justify-between p-12 relative border-r border-zinc-900 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-yellow-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-yellow-500/5 blur-[120px]" />

        {/* Branding header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-bold text-black text-xl">
            TS
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white">
            theandscribe
          </span>
        </div>

        {/* Main message */}
        <div className="my-auto max-w-lg z-10">
          <h1 className="text-4xl lg:text-5xl font-heading font-bold tracking-tightest leading-tight text-white mb-6">
            Get accurate transcripts in <span className="text-primary">minutes</span>.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Create your account to start converting audio and video files. Get transcription results and high-fidelity AI summaries, all on a zero-cost infrastructure.
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

      {/* Right Column (45%): Sign Up Form */}
      <div className="w-full md:w-[45%] bg-background text-foreground flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-6 md:hidden">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black text-lg">
                TS
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                theandscribe
              </span>
            </div>
            <h2 className="text-3xl font-heading font-bold tracking-tighter text-foreground mb-2">
              Create an account
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign up to get started with theandscribe
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
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Or register with email
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                disabled={loading || googleLoading}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-tertiary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading || googleLoading}
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-tertiary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative mb-2">
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Password Strength:</span>
                    <span className={passwordStrength >= 2 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-full rounded-full transition-all duration-300 ${
                          index <= passwordStrength ? strength.color : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading || googleLoading}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-tertiary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || passwordStrength < 2}
              className="w-full h-11 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <FaSpinner className="animate-spin" />}
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-accent-hover transition underline decoration-2 decoration-primary/30 hover:decoration-primary"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
