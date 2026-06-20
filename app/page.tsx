'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SplashScreen } from '@/components/ui/SplashScreen';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
  FaBolt, 
  FaBrain, 
  FaRegClock, 
  FaDatabase, 
  FaShieldAlt, 
  FaArrowRight,
  FaGithub,
  FaBars,
  FaTimes
} from 'react-icons/fa';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { resolvedTheme } = useTheme();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Force the splash screen to display for at least 1.2s to look premium and deliberate
        await new Promise((resolve) => setTimeout(resolve, 1200));

        if (user) {
          setAuthenticated(true);
          router.push('/dashboard');
        } else {
          setShouldFadeOut(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setShouldFadeOut(true);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [supabase, router]);

  // Determine which navbar logo to use based on the theme
  const logoSrc = mounted && resolvedTheme === 'light' 
    ? '/Logo/logo_light_theme_navbar.svg' 
    : '/Logo/logo_dark_theme_navbar.svg';

  return (
    <>
      {!showLanding && (
        <SplashScreen
          startFadeOut={shouldFadeOut}
          onFadeComplete={() => setShowLanding(true)}
        />
      )}

      {showLanding && (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
          {/* Header */}
          <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {mounted && (
                <img
                  src={logoSrc}
                  alt="theandscribe logo"
                  className="w-8 h-8 rounded-lg select-none"
                />
              )}
              <span className="font-heading font-black text-lg tracking-tightest uppercase select-none hidden min-[400px]:inline">
                theandscribe
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            </nav>

            {/* Desktop CTA buttons — hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-foreground px-4 py-2 hover:bg-muted rounded-xl transition duration-150"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-accent-hover text-black font-bold text-sm transition duration-150"
              >
                Get Started <FaArrowRight size={10} />
              </Link>
            </div>

            {/* Mobile Hamburger Button — only visible on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all duration-200 cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                style={{
                  display: 'block',
                  transition: 'transform 0.25s ease, opacity 0.2s ease',
                  transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </span>
            </button>

            {/* Mobile Dropdown — animated slide-down */}
            <div
              style={{
                maxHeight: mobileMenuOpen ? '420px' : '0px',
                opacity: mobileMenuOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
              }}
              className="absolute top-16 left-0 right-0 border-b border-border bg-background/98 backdrop-blur-lg md:hidden z-50"
            >
              <div className="p-5 flex flex-col gap-3">
                {/* Nav links */}
                <nav className="flex flex-col gap-1">
                  {[
                    { label: 'Features', href: '#features' },
                    { label: 'Pipeline', href: '#pipeline' },
                    { label: 'Pricing',  href: '#pricing'  },
                  ].map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      {label}
                    </a>
                  ))}
                </nav>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Auth buttons */}
                <div className="flex flex-col gap-2 pb-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-11 w-full rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted transition duration-150"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-primary hover:bg-accent-hover text-black font-bold text-sm transition duration-150"
                  >
                    Get Started <FaArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="flex-1 max-w-5xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

            <div className="space-y-6 max-w-3xl z-10">
              <div className="animate-fade-up delay-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary select-none">
                <FaBolt size={10} /> Simultaneous Multi-Engine Transcription
              </div>

              <h1 className="animate-fade-up delay-100 text-4xl sm:text-6xl font-heading font-bold tracking-tightest leading-[1.1] text-foreground">
                Turn your voice into <span className="text-primary bg-primary/5 px-2 rounded-xl border border-primary/10">structured content</span>, in seconds.
              </h1>

              <p className="animate-fade-up delay-200 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A premium, zero-cost transcription workspace. We run state-of-the-art APIs in parallel—yielding ultra-accurate text, meeting notes, and summaries instantly.
              </p>

              <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Link
                  href="/register"
                  className="w-full sm:w-auto h-11 px-8 rounded-xl bg-primary hover:bg-accent-hover text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Transcribing Free <FaArrowRight size={12} />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto h-11 px-8 rounded-xl border border-border hover:bg-muted font-bold text-sm flex items-center justify-center transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/40 w-full">
            <div className="animate-fade-up delay-0 text-center max-w-2xl mx-auto mb-16 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tightest uppercase">
                Engineered for Speed & Value
              </h2>
              <p className="text-sm text-muted-foreground">
                A powerful orchestration pipeline built to save you time and eliminate subscriptions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="animate-fade-up delay-100 bg-card border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 group shadow-sm flex flex-col justify-between hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                    <FaBolt size={16} />
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Multi-Engine Spreading
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We launch transcription requests across Groq, Deepgram, and AssemblyAI concurrently. The fastest API result wins—ensuring lightning speed.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="animate-fade-up delay-200 bg-card border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 group shadow-sm flex flex-col justify-between hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                    <FaBrain size={16} />
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    LLaMA 3.3 Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Transform raw transcripts into formatted markdown articles, comprehensive summaries, blog entries, or task lists powered by Groq LLaMA models.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="animate-fade-up delay-300 bg-card border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 group shadow-sm flex flex-col justify-between hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                    <FaRegClock size={16} />
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Zero Cost Quotas
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Uses developer free-tiers. The app tracks monthly API allowances dynamically per provider to give you maximum usage completely free of charge.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Architecture Section */}
          <section id="pipeline" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/40 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-up delay-0 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                  <FaDatabase size={10} /> Cloud-Safe Policy
                </div>
                <h2 className="text-3xl font-heading font-black tracking-tightest uppercase text-foreground leading-[1.1]">
                  Zero Storage Footprint
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your privacy is a priority. Media uploads are processed securely using temporary signed storage buckets and are **permanently destroyed** from the cloud once transcription and AI post-processing complete successfully.
                </p>

                <div className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                  <div className="flex items-center gap-2.5">
                    <FaShieldAlt className="text-primary" /> End-to-end encrypted user authentication
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FaShieldAlt className="text-primary" /> Clean local-first metadata storage
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FaShieldAlt className="text-primary" /> Exportable formats (TXT, PDF, Word, SRT, VTT)
                  </div>
                </div>
              </div>

              {/* Graphical Stack Card */}
              <div className="animate-fade-up delay-200 p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4">
                  Supported API Integrations
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Groq Whisper API', status: 'Fastest Local', limit: '25MB max size' },
                    { name: 'Deepgram Nova-2', status: 'Enterprise', limit: '500MB max size' },
                    { name: 'AssemblyAI Universal', status: 'High Fidelity', limit: '500MB max size' },
                    { name: 'Gladia Audio Engine', status: 'Multilingual', limit: '20MB max size' },
                  ].map((engine) => (
                    <div key={engine.name} className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                      <div>
                        <p className="font-bold text-foreground">{engine.name}</p>
                        <p className="text-[10px] text-muted-foreground">{engine.limit}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                        {engine.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Banner */}
          <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/40 w-full text-center">
            <div className="animate-scale-in delay-0 bg-card border border-border rounded-3xl p-10 md:p-16 relative overflow-hidden max-w-4xl mx-auto shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-6 max-w-lg mx-auto">
                <h2 className="text-3xl font-heading font-black tracking-tightest uppercase text-foreground">
                  $0/Month. Forever.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No subscription models, no paywalls. theandscribe uses direct API configurations, making it free to run forever by staying comfortably inside free tier rates.
                </p>
                <div className="pt-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-primary hover:bg-accent-hover text-black font-bold transition duration-150"
                  >
                    Start Free <FaArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border bg-card py-10 px-6 text-xs text-muted-foreground">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className="font-heading font-black uppercase text-foreground">theandscribe</span>
                <span>&copy; {new Date().getFullYear()} all rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <FaGithub /> GitHub
                </a>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
