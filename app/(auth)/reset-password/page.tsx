'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?message=Reset link verified. Please update your password.`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSubmitted(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      toast.error('Failed to send reset link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-zinc-950 text-white rounded-2xl border border-zinc-900 p-8 relative overflow-hidden shadow-lg">
        {/* Glow */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full bg-yellow-500/5 blur-[100px] pointer-events-none" />

        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 mb-8 justify-center hover:opacity-80 transition-opacity">
          <img
            src="/Logo/logo_dark_theme_navbar.svg"
            alt="theandscribe logo"
            className="w-8 h-8 rounded-lg select-none"
          />
          <span className="font-heading font-bold text-lg tracking-tight text-white">
            theandscribe
          </span>
        </Link>

        {!submitted ? (
          <>
            <h2 className="text-2xl font-heading font-bold text-center text-white mb-2">
              Reset your password
            </h2>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading && <FaSpinner className="animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Check your email
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              We've sent a password reset link to <strong className="text-white">{email}</strong>. Please check your inbox and click the link to reset your password.
            </p>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 mb-6 text-xs text-zinc-500">
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-accent-hover transition underline decoration-2 decoration-primary/30 hover:decoration-primary"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
