'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FaUser,
  FaPalette,
  FaBolt,
  FaDatabase,
  FaSignOutAlt,
  FaSpinner,
  FaSun,
  FaMoon,
  FaLaptop,
  FaMicrophone
} from 'react-icons/fa';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { usageCount, dailyLimit, remaining, isLoading: usageLoading } = useDailyUsage();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [brandVoice, setBrandVoice] = useState<string>('');
  const [updatingBrandVoice, setUpdatingBrandVoice] = useState(false);
  const [quotaHistory, setQuotaHistory] = useState<any[]>([]);
  const [quotaHistoryLoading, setQuotaHistoryLoading] = useState(true);

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUserEmail(user.email ?? null);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, brand_voice')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserFullName((profile as any).full_name);
          setUserRole((profile as any).role);
          setBrandVoice((profile as any).brand_voice ?? '');
        }

        const { data: history } = await supabase
          .from('provider_usage')
          .select('provider, month_year, minutes_used, minutes_limit')
          .eq('user_id', user.id)
          .order('month_year', { ascending: false });

        if (history) {
          setQuotaHistory(history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProfileLoading(false);
        setQuotaHistoryLoading(false);
      }
    }
    loadProfile();
  }, [supabase, router]);

  // Handle name update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase.from('profiles') as any)
        .update({
          full_name: userFullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle brand voice update
  const handleUpdateBrandVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBrandVoice(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase.from('profiles') as any)
        .update({
          brand_voice: brandVoice.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Brand voice saved! Future AI generations will use this tone.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save brand voice');
    } finally {
      setUpdatingBrandVoice(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Sign out failed');
      setLoggingOut(false);
    }
  };

  const usagePercent = Math.min(100, (usageCount / dailyLimit) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences, theme, and view service usage quota.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Category tabs/labels */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2.5 mb-2">
            Categories
          </p>
          <div className="bg-card border border-border rounded-xl p-2 space-y-1">
            <a href="#profile" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors">
              <FaUser size={12} className="text-muted-foreground" /> Profile Settings
            </a>
            <a href="#brand-voice" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors">
              <FaMicrophone size={12} className="text-muted-foreground" /> Brand Voice
            </a>
            <a href="#appearance" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors">
              <FaPalette size={12} className="text-muted-foreground" /> Appearance
            </a>
            <a href="#quota" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors">
              <FaBolt size={12} className="text-muted-foreground" /> Usage & Quotas
            </a>
            <a href="#storage" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors">
              <FaDatabase size={12} className="text-muted-foreground" /> Storage Strategy
            </a>
          </div>
        </div>

        {/* Right Side: Settings panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile card */}
          <section id="profile" className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 scroll-mt-6">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FaUser className="text-primary" size={13} /> Profile Settings
            </h3>

            {profileLoading ? (
              <div className="flex items-center justify-center py-6">
                <FaSpinner className="animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail ?? ''}
                    disabled
                    className="w-full h-10 px-3 rounded-xl border border-border bg-muted/50 text-muted-foreground text-xs cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Logged in account. Cannot be changed.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userFullName ?? ''}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Workspace Role
                  </label>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                    {userRole ?? 'User'}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-primary text-black font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
                >
                  {updatingProfile ? <FaSpinner className="animate-spin mr-1.5" size={10} /> : null}
                  Save Profile
                </Button>
              </form>
            )}
          </section>

          {/* Brand Voice card */}
          <section id="brand-voice" className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 scroll-mt-6">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FaMicrophone className="text-primary" size={13} /> AI Brand Voice
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Describe your preferred writing tone and style. This will be injected into every AI generation — blog posts, social captions, summaries — to make the output sound like <em>you</em>.
            </p>

            <form onSubmit={handleUpdateBrandVoice} className="space-y-3">
              <div className="relative">
                <textarea
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value.slice(0, 500))}
                  placeholder={`Examples:\n• "Write in a casual, witty tone — like a smart friend explaining things. Use short sentences and occasional humour."
• "Professional and authoritative. No slang. Use data-driven language and confident assertions."
• "Warm, encouraging, and community-focused. Use 'we' language and end with an uplifting call to action."`}
                  rows={6}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground/60 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none leading-relaxed"
                />
                <span className={`absolute bottom-2.5 right-3 text-[10px] font-mono ${
                  brandVoice.length > 450 ? 'text-yellow-500' : 'text-muted-foreground'
                }`}>
                  {brandVoice.length}/500
                </span>
              </div>
              {brandVoice.trim() && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary">
                  <span className="font-semibold">Active — </span>
                  <span className="text-muted-foreground">Your brand voice will shape all future AI-generated content. Cached outputs won&apos;t change — only new generations.</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={updatingBrandVoice}
                className="bg-primary text-black font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                {updatingBrandVoice ? <FaSpinner className="animate-spin mr-1.5" size={10} /> : null}
                Save Brand Voice
              </Button>
            </form>
          </section>

          {/* Appearance card */}
          <section id="appearance" className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 scroll-mt-6">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FaPalette className="text-primary" size={13} /> Appearance
            </h3>
            <p className="text-xs text-muted-foreground">Select how VoiceScribe interface looks on your device.</p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'light', label: 'Light', icon: FaSun },
                { name: 'dark', label: 'Dark', icon: FaMoon },
                { name: 'system', label: 'System', icon: FaLaptop },
              ].map((t) => {
                const Icon = t.icon;
                const active = theme === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer bg-muted/20 hover:bg-muted/40',
                      active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    <Icon size={16} className="mb-2" />
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quota card */}
          <section id="quota" className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 scroll-mt-6">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FaBolt className="text-primary" size={13} /> Usage & Quotas
            </h3>
            <p className="text-xs text-muted-foreground">
              Multiple transcription engines run simultaneously to stay within each provider's free tier limits. The fastest result wins.
            </p>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Daily Transcription Count</span>
                <span className="font-bold text-foreground">
                  {usageLoading ? '--' : usageCount} / {dailyLimit} transcripts
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <span>Remaining Today: {usageLoading ? '--' : remaining}</span>
                <span>Limit resets at midnight UTC</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-border rounded-xl p-3.5 bg-muted/20">
                <p className="font-semibold text-muted-foreground mb-0.5">Strategy</p>
                <p className="font-bold text-primary">Multi-Engine</p>
              </div>
              <div className="border border-border rounded-xl p-3.5 bg-muted/20">
                <p className="font-semibold text-muted-foreground mb-0.5">Method</p>
                <p className="font-bold text-foreground">Fastest Result Wins</p>
              </div>
            </div>

            {/* Quota History Table */}
            <div className="space-y-2.5 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Usage History
              </h4>
              {quotaHistoryLoading ? (
                <div className="flex justify-center py-4">
                  <FaSpinner className="animate-spin text-primary" size={14} />
                </div>
              ) : quotaHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No usage history found.</p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted border-b border-border font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                        <th className="p-3">Month</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3 text-right">Used</th>
                        <th className="p-3 text-right">Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {quotaHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-muted/10 font-medium">
                          <td className="p-3 text-muted-foreground">{h.month_year}</td>
                          <td className="p-3 capitalize">{h.provider === 'groq' ? 'Groq (Whisper)' : h.provider}</td>
                          <td className="p-3 text-right font-mono">{h.minutes_used.toFixed(1)}m</td>
                          <td className="p-3 text-right font-mono text-muted-foreground">{h.minutes_limit}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Storage card */}
          <section id="storage" className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 scroll-mt-6">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FaDatabase className="text-primary" size={13} /> Storage Strategy
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your audio and video files consume 0MB of permanent database storage. To guarantee zero operational cost, VoiceScribe deletes temporary media uploads from Supabase Storage the second the transcription API completes. Only light metadata and text content are kept permanently.
            </p>
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary font-semibold flex items-center justify-between">
              <span>Permanently Saved Data:</span>
              <span className="bg-primary/20 px-2.5 py-0.5 rounded-full text-[10px]">Text Only</span>
            </div>
          </section>

          {/* Log out button */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="flex items-center gap-2 hover:bg-red-500/10 text-red-500 hover:text-red-400 font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              {loggingOut ? <FaSpinner className="animate-spin" size={12} /> : <FaSignOutAlt size={12} />}
              Log Out of Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
