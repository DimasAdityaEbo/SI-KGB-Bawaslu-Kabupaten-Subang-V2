import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, LogOut } from 'lucide-react';
import { BawasluLogo } from './BawasluLogo';

interface HeaderProps {
  currentUser: User;
  pegawaiName?: string;
  onLogout: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pegawaiName,
  onLogout,
  notifications,
  onOpenNotifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = pegawaiName || currentUser.namaLengkap;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Zone 1: Brand title & Official Logo */}
      <div className="flex items-center gap-3">
        <BawasluLogo size="md" showText={false} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              SIAGA-KGB
            </span>
            <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 sm:inline-block border border-slate-200">
              BAWASLU SUBANG
            </span>
          </div>
          <p className="hidden text-[11px] text-slate-500 md:block">
            Sistem Informasi Kenaikan Gaji Berkala · Bawaslu Kabupaten Subang
          </p>
        </div>
      </div>

      {/* User Info, Notifications, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title="Notifikasi Sistem"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="font-mono-numbers absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] capitalize text-slate-500">
              {currentUser.role === 'admin'
                ? 'Administrator Sistem'
                : currentUser.role === 'kasubag'
                ? 'Kepala Sub Bagian (Kasubag)'
                : 'Pegawai ASN / Non-ASN'}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
            {displayName.charAt(0)}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          title="Keluar dari Aplikasi"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
