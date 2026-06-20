'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaEdit,
  FaRedoAlt,
  FaUserShield,
  FaSpinner,
  FaChartBar,
  FaMicrophone
} from 'react-icons/fa';
import Button from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'An error occurred while fetching data');
  }
  return res.json();
};

interface UserRecord {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  createdAt: string;
  email: string;
  dailyLimit: number;
  dailyUsage: number;
  totalTranscripts: number;
}

interface StatsData {
  totalUsers: number;
  totalTranscripts: number;
  statusBreakdown: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  providerBreakdown: {
    groq: number;
    gladia: number;
    assemblyai: number;
    deepgram: number;
  };
  chartData: { date: string; count: number }[];
}

export default function AdminPage() {
  const { data: statsData, error: statsError, mutate: mutateStats, isLoading: statsLoading } = useSWR<{ stats: StatsData }>(
    '/api/admin/stats',
    fetcher
  );

  const { data: usersData, error: usersError, mutate: mutateUsers, isLoading: usersLoading } = useSWR<{ users: UserRecord[] }>(
    '/api/admin/users',
    fetcher
  );

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Update states
  const [newLimit, setNewLimit] = useState(10);
  const [updating, setUpdating] = useState(false);

  const handleOpenLimitModal = (user: UserRecord) => {
    setSelectedUser(user);
    setNewLimit(user.dailyLimit);
    setIsLimitModalOpen(true);
  };

  const handleOpenRoleModal = (user: UserRecord) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleOpenResetModal = (user: UserRecord) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  const handleUpdateLimit = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'update_limit',
          dailyLimit: Number(newLimit)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update limit');
      
      toast.success(`Successfully updated daily limit for ${selectedUser.fullName}`);
      mutateUsers();
      setIsLimitModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRole = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    const targetRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'update_role',
          role: targetRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      toast.success(`Role updated to ${targetRole} for ${selectedUser.fullName}`);
      mutateUsers();
      mutateStats();
      setIsRoleModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetUsage = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'reset_usage'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset usage');

      toast.success(`Daily usage count reset for ${selectedUser.fullName}`);
      mutateUsers();
      setIsResetModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Search filter
  const filteredUsers = (usersData?.users ?? []).filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term)
    );
  });

  const stats = statsData?.stats;
  const successRate = stats
    ? stats.totalTranscripts > 0
      ? Math.round((stats.statusBreakdown.completed / stats.totalTranscripts) * 100)
      : 0
    : 0;

  // Chart helpers
  const maxDayCount = stats?.chartData.reduce((max, d) => (d.count > max ? d.count : max), 1) || 1;

  if (statsError || usersError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <FaTimesCircle className="text-red-500 mb-4 animate-pulse" size={48} />
        <h2 className="text-xl font-heading font-bold text-foreground">Error Loading Admin Data</h2>
        <p className="text-muted-foreground mt-2">
          {statsError?.message || usersError?.message || 'Check connection to Supabase.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <FaUserShield className="text-primary" /> Admin Panel Overview
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor system metrics, review quotas, and configure user permissions.
        </p>
      </div>

      {statsLoading || usersLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <FaSpinner className="animate-spin text-primary" size={32} />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading administrative analytics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Users */}
            <Card className="relative overflow-hidden bg-zinc-950/20 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
                    <h3 className="text-3xl font-heading font-black text-foreground">{stats?.totalUsers}</h3>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <FaUsers size={20} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Registered profiles on the platform
                </div>
              </CardContent>
            </Card>

            {/* Total Transcriptions */}
            <Card className="relative overflow-hidden bg-zinc-950/20 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcripts</p>
                    <h3 className="text-3xl font-heading font-black text-foreground">{stats?.totalTranscripts}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <FaFileAlt size={20} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground flex gap-3">
                  <span>Pending: {stats?.statusBreakdown.pending}</span>
                  <span>Processing: {stats?.statusBreakdown.processing}</span>
                </div>
              </CardContent>
            </Card>

            {/* System Success Rate */}
            <Card className="relative overflow-hidden bg-zinc-950/20 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Success Rate</p>
                    <h3 className="text-3xl font-heading font-black text-foreground">{successRate}%</h3>
                  </div>
                  <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
                    <FaCheckCircle size={20} />
                  </div>
                </div>
                {/* Visual mini-bar */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${successRate}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Engine Breakdown */}
            <Card className="relative overflow-hidden bg-zinc-950/20 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Engines</p>
                    <h3 className="text-3xl font-heading font-black text-foreground">4 Providers</h3>
                  </div>
                  <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl">
                    <FaMicrophone size={20} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span className="truncate">Groq: {stats?.providerBreakdown.groq}</span>
                  <span className="truncate">Gladia: {stats?.providerBreakdown.gladia}</span>
                  <span className="truncate">Assembly: {stats?.providerBreakdown.assemblyai}</span>
                  <span className="truncate">Deepgram: {stats?.providerBreakdown.deepgram}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart & Provider Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Custom Premium Chart */}
            <Card className="lg:col-span-2 bg-zinc-950/10 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FaChartBar className="text-primary" /> Daily Transcriptions (Last 14 Days)
                </CardTitle>
                <CardDescription>Volume of transcription jobs executed per day.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-48 w-full flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-border pb-2">
                  {stats?.chartData.map((d) => {
                    const percentage = (d.count / maxDayCount) * 100;
                    const dateObj = new Date(d.date + 'T00:00:00');
                    const dayLabel = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute top-[-35px] bg-zinc-900 border border-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 shadow-lg z-10 whitespace-nowrap">
                          {d.count} transcripts ({dayLabel})
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${Math.max(4, percentage)}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 cursor-pointer ${
                            d.count > 0
                              ? 'bg-primary/80 hover:bg-primary group-hover:shadow-[0_0_12px_rgba(245,197,24,0.35)]'
                              : 'bg-zinc-800/40 hover:bg-zinc-800/60'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Labels */}
                <div className="flex justify-between text-[9px] text-muted-foreground px-1 pt-2">
                  <span>{stats && stats.chartData.length > 0 ? new Date(stats.chartData[0].date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                  <span>Middle</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>

            {/* Provider Breakdown List */}
            <Card className="bg-zinc-950/10 border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Transcription Breakdown</CardTitle>
                <CardDescription>Share of providers handling media jobs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && Object.entries(stats.providerBreakdown).map(([provider, count]) => {
                  const percentage = stats.totalTranscripts > 0 ? Math.round((count / stats.totalTranscripts) * 100) : 0;
                  return (
                    <div key={provider} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize text-foreground">{provider}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            provider === 'groq'
                              ? 'bg-yellow-500'
                              : provider === 'gladia'
                              ? 'bg-purple-500'
                              : provider === 'assemblyai'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <Card className="bg-zinc-950/10 border-border">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold">User Access & Limits</CardTitle>
                <CardDescription>Manage user registration records, modify transcription quotas, and grant administrator credentials.</CardDescription>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <FaSearch size={12} />
                </span>
                <Input
                  type="text"
                  placeholder="Search name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 placeholder-zinc-600 focus:border-primary text-sm h-9 rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-zinc-950/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Email / ID</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5 text-center">Daily Quota Usage</th>
                    <th className="px-6 py-3.5 text-center">Total Transcripts</th>
                    <th className="px-6 py-3.5 px-6 py-3.5 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        No registered users found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-950/30 transition duration-150 group">
                        <td className="px-6 py-4 flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-8 h-8 rounded-full border border-border/80 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-primary border border-border/80">
                              {user.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{user.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground font-medium">{user.email}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{user.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              user.role === 'admin'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-foreground">{user.dailyUsage}</span>
                          <span className="text-muted-foreground"> / {user.dailyLimit}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-foreground">
                          {user.totalTranscripts}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              title="Edit Quota Limit"
                              onClick={() => handleOpenLimitModal(user)}
                            >
                              <FaEdit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              title="Reset Quota Usage"
                              onClick={() => handleOpenResetModal(user)}
                            >
                              <FaRedoAlt size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-primary"
                              title="Toggle Role"
                              onClick={() => handleOpenRoleModal(user)}
                            >
                              <FaUserShield size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Quota Limit Modal */}
      <Modal
        open={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title="Adjust User Daily Limit"
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Configure daily transcription quota limit for <strong className="text-foreground">{selectedUser.fullName}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Daily limit (Transcriptions)</label>
              <Input
                type="number"
                min="0"
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800 text-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setIsLimitModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateLimit} isLoading={updating} size="sm">
                Save Limit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toggle Role Modal */}
      <Modal
        open={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Toggle User Role"
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to change the role of <strong className="text-foreground">{selectedUser.fullName}</strong> ({selectedUser.email}) to <strong className="text-primary">{selectedUser.role === 'admin' ? 'user' : 'admin'}</strong>?
            </p>
            <p className="text-xs text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
              Warning: Promoting users to admin grants full control over platform analytics, limits, and user configurations.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleToggleRole} isLoading={updating} size="sm">
                Confirm Update
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Usage Modal */}
      <Modal
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Daily Transcription Count"
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset today's usage count for <strong className="text-foreground">{selectedUser.fullName}</strong> ({selectedUser.email})?
            </p>
            <p className="text-xs text-muted-foreground">
              This resets their effective daily usage count back to <span className="text-green-500 font-bold">0</span> for today, enabling them to resume uploading immediate transcription requests if they hit their quota.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setIsResetModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleResetUsage} isLoading={updating} size="sm">
                Confirm Reset
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
