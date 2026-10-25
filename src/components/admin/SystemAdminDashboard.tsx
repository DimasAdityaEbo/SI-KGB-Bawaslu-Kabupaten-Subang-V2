import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Mail,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  UserCheck,
} from 'lucide-react';
import { User, EmailDispatchLog, SupabaseConfig, PengajuanKGB } from '../../types';
import { sendKgbStatusEmail } from '../../services/emailService';

interface SystemAdminDashboardProps {
  usersList: User[];
  emailLogs: EmailDispatchLog[];
  pengajuanList: PengajuanKGB[];
  supabaseConfig: SupabaseConfig;
  onSelectTab: (tab: string) => void;
  onRefreshData: () => void;
}

export const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({
  usersList,
  emailLogs,
  pengajuanList,
  supabaseConfig,
  onSelectTab,
  onRefreshData,
}) => {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const totalUsers = usersList.length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;
  const kasubagCount = usersList.filter((u) => u.role === 'kasubag').length;
  const pegawaiCount = usersList.filter((u) => u.role === 'pegawai').length;
  const activeCount = usersList.filter((u) => u.status === 'aktif').length;
  const inactiveCount = usersList.filter((u) => u.status === 'nonaktif').length;

  const totalEmails = emailLogs.length;
  const deliveredEmails = emailLogs.filter((e) => e.status === 'delivered').length;
  const failedEmails = emailLogs.filter((e) => e.status === 'failed').length;

  const handleSendTestEmail = async () => {
    if (pengajuanList.length === 0) return;
    setIsSendingTest(true);
    setTestSuccess(null);
    try {
      const sample = pengajuanList[0];
      await sendKgbStatusEmail(sample, 'dibuat');
      setTestSuccess('Email simulasi berhasil diproses dan dicatat dalam log!');
      onRefreshData();
      setTimeout(() => setTestSuccess(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSendingTest(false);
    }
  };

  const recentUsers = [...usersList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEmails = [...emailLogs].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Portal Administrator Sistem
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Dashboard Kontrol &amp; Manajemen Sistem
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pusat kendali akun pengguna (Admin, Kasubag, Pegawai), pemantauan pengiriman email notifikasi otomatis, dan status integrasi database cloud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectTab('users')}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100 transition shadow"
            >
              <Users className="h-4 w-4 text-slate-700" />
              <span>Kelola User</span>
            </button>
            <button
              onClick={() => onSelectTab('email-logs')}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 border border-slate-700 transition"
            >
              <Mail className="h-4 w-4 text-sky-400" />
              <span>Log Email</span>
            </button>
          </div>
        </div>
      </div>

      {testSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pengguna</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-slate-900">{totalUsers}</span>
            <span className="text-xs text-slate-500">akun terdaftar</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span className="font-semibold text-purple-700">{adminCount} Admin</span>
            <span>•</span>
            <span className="font-semibold text-amber-700">{kasubagCount} Kasubag</span>
            <span>•</span>
            <span className="font-semibold text-sky-700">{pegawaiCount} Pegawai</span>
          </div>
        </div>

        {/* User Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Status Akun</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-slate-500">aktif</span>
            {inactiveCount > 0 && (
              <span className="text-xs text-red-500 font-semibold">({inactiveCount} nonaktif)</span>
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            Semua pengguna berstatus aktif dapat mengakses sistem
          </div>
        </div>

        {/* Email Logs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Email Notifikasi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-slate-900">{totalEmails}</span>
            <span className="text-xs text-slate-500">terkirim</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2.5">
            <span className="text-emerald-700 font-medium">✓ {deliveredEmails} delivered</span>
            {failedEmails > 0 && <span className="text-red-600 font-medium">{failedEmails} failed</span>}
          </div>
        </div>

        {/* Database Cloud Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Koneksi Database</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-900">
              {supabaseConfig.isConnected ? 'Supabase Cloud' : 'Local Storage'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 truncate">
            {supabaseConfig.url ? supabaseConfig.url.replace('https://', '') : 'Tersimpan lokal'}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Users & Recent Email Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: User Management Quick View */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna</h2>
            </div>
            <button
              onClick={() => onSelectTab('users')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              <span>Kelola Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {user.namaLengkap.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{user.namaLengkap}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-mono">@{user.username}</span>
                      <span>•</span>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.role === 'admin' ? (
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                      Admin
                    </span>
                  ) : user.role === 'kasubag' ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                      Kasubag
                    </span>
                  ) : (
                    <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                      Pegawai
                    </span>
                  )}
                  <span
                    className={`h-2 w-2 rounded-full ${
                      user.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Email Dispatch Quick View */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Log Email Notifikasi Terkini</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                <Send className={`h-3 w-3 ${isSendingTest ? 'animate-spin' : ''}`} />
                <span>Tes Email</span>
              </button>
              <button
                onClick={() => onSelectTab('email-logs')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEmails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada log pengiriman email tercatat.
              </div>
            ) : (
              recentEmails.map((log) => (
                <div key={log.id} className="px-5 py-3 hover:bg-slate-50/80 transition text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{log.toName}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-600 truncate">{log.subject}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400">{log.toEmail}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
