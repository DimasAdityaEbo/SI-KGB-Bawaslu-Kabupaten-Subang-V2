import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  BarChart3,
  FilePlus2,
  History,
  BookOpen,
  Building2,
  Mail,
  ChevronRight,
  KeyRound,
  UserCheck,
  FileCode,
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingCount: number;
  hasOngoingPengajuan?: boolean;
  onOpenEmailLogs?: () => void;
  onOpenUbahPassword: () => void;
  onOpenKopSuratModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentTab,
  onSelectTab,
  pendingCount,
  hasOngoingPengajuan = false,
  onOpenEmailLogs,
  onOpenUbahPassword,
  onOpenKopSuratModal,
}) => {
  // Admin: Hanya Dashboard, Kelola User, Log Email Notifikasi
  const adminMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Sistem',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'users',
      label: 'Kelola User',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'email-logs',
      label: 'Log Email Notifikasi',
      icon: Mail,
      badge: null,
    },
  ];

  // Kasubag: Dashboard, Kelola Pegawai, Daftar Pengajuan, Laporan KGB, Template Dokumen, Pengaturan Kop Surat
  const kasubagMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Operasional',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pegawai',
      label: 'Kelola Pegawai',
      icon: Users,
      badge: null,
    },
    {
      id: 'pengajuan',
      label: 'Daftar Pengajuan',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'laporan',
      label: 'Laporan KGB',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'template',
      label: 'Template Dokumen',
      icon: FileCode,
      badge: null,
    },
    {
      id: 'kop-surat',
      label: 'Pengaturan Kop Surat',
      icon: Building2,
      badge: null,
    },
  ];

  // Pegawai: Portal Pelayanan
  const pegawaiMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Pegawai',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'profil',
      label: 'Profil & Data Diri',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'ajukan',
      label: 'Ajukan Permohonan',
      icon: FilePlus2,
      badge: hasOngoingPengajuan ? 'Diproses' : null,
    },
    {
      id: 'riwayat',
      label: 'Riwayat Pengajuan',
      icon: History,
      badge: null,
    },
    {
      id: 'regulasi',
      label: 'SOP & Dasar Hukum',
      icon: BookOpen,
      badge: null,
    },
  ];

  const menuItems =
    role === 'admin'
      ? adminMenuItems
      : role === 'kasubag'
      ? kasubagMenuItems
      : pegawaiMenuItems;

  const categoryLabel =
    role === 'admin'
      ? 'Menu Administrator'
      : role === 'kasubag'
      ? 'Menu Kasubag'
      : 'Portal Pelayanan';

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between min-h-[calc(100vh-61px)]">
      <div className="p-4">
        {/* Navigation Category Label */}
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {categoryLabel}
        </div>

        {/* Menu List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`font-mono-numbers rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Account Utility Section (Ubah Password) */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pengaturan Akun
          </div>
          <div className="space-y-1">
            <button
              onClick={onOpenUbahPassword}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>Ubah Password</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Office Footer Card */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-start gap-2.5">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800">Bawaslu Kab. Subang</p>
            <p className="text-slate-500"> Jl. Palabuan No.9, Kelurahan Sukamelang, Kecamatan Subang, Kabupaten Subang, Jawa Barat 41211.</p>
            <p className="mt-1 font-mono text-[10px] text-slate-400">Kode Satker: 686138</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
