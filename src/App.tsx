import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Pegawai,
  PengajuanKGB,
  NotificationItem,
  EmailDispatchLog,
  SupabaseConfig,
} from './types';
import {
  getPegawaiList,
  getPengajuanList,
  getUsersList,
  getNotifications,
  getEmailLogs,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './services/storage';
import { getSavedSupabaseConfig, subscribeToSupabaseChanges } from './services/supabase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { KelolaPegawai } from './components/admin/KelolaPegawai';
import { DaftarPengajuan } from './components/admin/DaftarPengajuan';
import { KelolaUser } from './components/admin/KelolaUser';
import { LaporanKgb } from './components/admin/LaporanKgb';
import { TemplateDokumenView } from './components/admin/TemplateDokumenView';
import { PegawaiDashboard } from './components/pegawai/PegawaiDashboard';
import { AjukanPermohonan } from './components/pegawai/AjukanPermohonan';
import { RiwayatPengajuan } from './components/pegawai/RiwayatPengajuan';
import { RegulasiView } from './components/pegawai/RegulasiView';
import { ProfilPegawaiView } from './components/pegawai/ProfilPegawaiView';
import { EmailLogModal } from './components/EmailLogModal';
import { NotificationModal } from './components/NotificationModal';
import { UbahPasswordModal } from './components/UbahPasswordModal';
import { KopSuratModal } from './components/admin/KopSuratModal';
import { SystemAdminDashboard } from './components/admin/SystemAdminDashboard';
import { LogEmailView } from './components/admin/LogEmailView';
import { PengaturanKopSuratView } from './components/admin/PengaturanKopSuratView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Master Data States
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [pengajuanList, setPengajuanList] = useState<PengajuanKGB[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig());

  // Navigation Deep Links
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanKGB | null>(null);

  // Modals
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isUbahPasswordModalOpen, setIsUbahPasswordModalOpen] = useState(false);
  const [isGlobalKopModalOpen, setIsGlobalKopModalOpen] = useState(false);

  // Load Data
  const loadAllData = useCallback(async () => {
    try {
      const [pList, kgbList, uList, nList, eList] = await Promise.all([
        getPegawaiList(),
        getPengajuanList(),
        getUsersList(),
        getNotifications(),
        getEmailLogs(),
      ]);

      setPegawaiList(pList);
      setPengajuanList(kgbList);
      setUsersList(uList);
      setNotifications(nList);
      setEmailLogs(eList);
      setSupabaseConfig(getSavedSupabaseConfig());

      // If user is logged in, sync currentUser in case updated
      setCurrentUser((currentUser) => {
        if (!currentUser) return currentUser;
        const refreshedUser = uList.find((u) => u.id === currentUser.id);
        return refreshedUser || currentUser;
      });
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Halaman pertama yang tampil saat membuka aplikasi selalu halaman login
    setCurrentUser(null);
    localStorage.removeItem('sikgb_session_user');
  }, [loadAllData]);

  useEffect(() => {
    let refreshTimer: number | undefined;
    const refresh = () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void loadAllData();
      }, 200);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const unsubscribe = subscribeToSupabaseChanges(refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [loadAllData, supabaseConfig.url, supabaseConfig.anonKey]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sikgb_session_user', JSON.stringify(user));
    setCurrentTab('dashboard');
    setSelectedPengajuan(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sikgb_session_user');
  };

  const handleMarkNotifRead = async (id: string) => {
    await markNotificationAsRead(id);
    const updated = await getNotifications();
    setNotifications(updated);
  };

  const handleMarkAllNotifsRead = async () => {
    await markAllNotificationsAsRead(currentUser?.id);
    const updated = await getNotifications();
    setNotifications(updated);
  };

  // Find linked pegawai record if role is pegawai
  const linkedPegawai = currentUser?.pegawaiId
    ? pegawaiList.find((p) => p.id === currentUser.pegawaiId)
    : currentUser?.role === 'pegawai'
    ? pegawaiList.find((p) => p.email === currentUser.email || p.nama === currentUser.namaLengkap) || pegawaiList[0]
    : undefined;

  const currentDisplayName = currentUser?.role === 'pegawai' && linkedPegawai
    ? linkedPegawai.nama
    : currentUser?.namaLengkap || 'Pengguna';

  // Synchronize currentUser with updated employee data in real-time
  useEffect(() => {
    if (currentUser && currentUser.role === 'pegawai') {
      const match = currentUser.pegawaiId
        ? pegawaiList.find((p) => p.id === currentUser.pegawaiId)
        : pegawaiList.find((p) => p.email === currentUser.email);
      if (match && match.nama !== currentUser.namaLengkap) {
        const updated: User = {
          ...currentUser,
          namaLengkap: match.nama,
          email: match.email,
          pegawaiId: match.id,
        };
        setCurrentUser(updated);
        localStorage.setItem('sikgb_session_user', JSON.stringify(updated));
      }
    }
  }, [pegawaiList, currentUser?.pegawaiId]);

  // Pending count for sidebar badge
  const pendingCount = pengajuanList.filter((p) => p.status === 'menunggu_verifikasi').length;

  // Check if active pegawai has an ongoing submission (not yet approved or rejected)
  const hasPegawaiOngoingPengajuan = linkedPegawai
    ? pengajuanList.some(
        (p) => p.pegawaiId === linkedPegawai.id && p.status !== 'disetujui' && p.status !== 'ditolak'
      )
    : false;

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} usersList={usersList} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        pegawaiName={currentDisplayName}
        onLogout={handleLogout}
        notifications={
          currentUser.role === 'admin' || currentUser.role === 'kasubag'
            ? notifications
            : notifications.filter((n) => n.userId === currentUser.pegawaiId || n.userId === currentUser.id)
        }
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          role={currentUser.role}
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedPengajuan(null);
          }}
          pendingCount={pendingCount}
          hasOngoingPengajuan={hasPegawaiOngoingPengajuan}
          onOpenEmailLogs={currentUser.role === 'admin' ? () => setCurrentTab('email-logs') : undefined}
          onOpenKopSuratModal={currentUser.role === 'kasubag' ? () => setCurrentTab('kop-surat') : undefined}
          onOpenUbahPassword={() => setIsUbahPasswordModalOpen(true)}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ================= ADMIN VIEWS (Khusus: Dashboard, Kelola User, Log Email) ================= */}
          {currentUser.role === 'admin' && (
            <>
              {currentTab === 'dashboard' && (
                <SystemAdminDashboard
                  usersList={usersList}
                  emailLogs={emailLogs}
                  pengajuanList={pengajuanList}
                  supabaseConfig={supabaseConfig}
                  onSelectTab={setCurrentTab}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'users' && (
                <KelolaUser
                  usersList={usersList}
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'email-logs' && (
                <LogEmailView
                  emailLogs={emailLogs}
                  pengajuanList={pengajuanList}
                  onRefreshLogs={loadAllData}
                />
              )}
            </>
          )}

          {/* ================= KASUBAG VIEWS (Dashboard, Kelola Pegawai, Daftar Pengajuan, Laporan KGB, Template Dokumen, Pengaturan Kop Surat) ================= */}
          {currentUser.role === 'kasubag' && (
            <>
              {currentTab === 'dashboard' && (
                <AdminDashboard
                  pegawaiList={pegawaiList}
                  pengajuanList={pengajuanList}
                  onSelectTab={setCurrentTab}
                  onViewPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('pengajuan');
                  }}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'pegawai' && (
                <KelolaPegawai
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'pengajuan' && (
                <DaftarPengajuan
                  pengajuanList={pengajuanList}
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                  selectedPengajuanFromDashboard={selectedPengajuan}
                  onClearSelectedPengajuan={() => setSelectedPengajuan(null)}
                />
              )}

              {currentTab === 'laporan' && (
                <LaporanKgb
                  pengajuanList={pengajuanList}
                  pegawaiList={pegawaiList}
                />
              )}

              {currentTab === 'template' && (
                <TemplateDokumenView
                  pegawaiList={pegawaiList}
                  pengajuanList={pengajuanList}
                />
              )}

              {currentTab === 'kop-surat' && (
                <PengaturanKopSuratView
                  onRefreshData={loadAllData}
                />
              )}
            </>
          )}

          {/* ================= PEGAWAI VIEWS ================= */}
          {currentUser.role === 'pegawai' && (
            <>
              {currentTab === 'dashboard' && linkedPegawai && (
                <PegawaiDashboard
                  currentUser={currentUser}
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onSelectTab={setCurrentTab}
                  onViewPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('riwayat');
                  }}
                />
              )}

              {currentTab === 'ajukan' && linkedPegawai && (
                <AjukanPermohonan
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onRefreshData={loadAllData}
                  onSuccessRedirect={() => setCurrentTab('riwayat')}
                  onViewDetailPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('riwayat');
                  }}
                />
              )}

              {currentTab === 'riwayat' && linkedPegawai && (
                <RiwayatPengajuan
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onRefreshData={loadAllData}
                  selectedPengajuanFromDashboard={selectedPengajuan}
                  onClearSelectedPengajuan={() => setSelectedPengajuan(null)}
                  onSelectTab={setCurrentTab}
                />
              )}

              {currentTab === 'regulasi' && <RegulasiView />}

              {currentTab === 'profil' && linkedPegawai && (
                <ProfilPegawaiView
                  pegawai={linkedPegawai}
                  currentUser={currentUser}
                  onRefreshData={loadAllData}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <EmailLogModal
        isOpen={isEmailLogsModalOpen}
        onClose={() => setIsEmailLogsModalOpen(false)}
        emailLogs={emailLogs}
        pengajuanList={pengajuanList}
        onRefreshLogs={loadAllData}
      />

      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={
          currentUser.role === 'admin'
            ? notifications
            : notifications.filter((n) => n.userId === currentUser.pegawaiId || n.userId === currentUser.id)
        }
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
      />

      {currentUser && (
        <UbahPasswordModal
          isOpen={isUbahPasswordModalOpen}
          onClose={() => setIsUbahPasswordModalOpen(false)}
          currentUser={currentUser}
          onPasswordChanged={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('sikgb_session_user', JSON.stringify(updatedUser));
            loadAllData();
          }}
        />
      )}

      {/* GLOBAL KOP SURAT CONFIGURATION MODAL */}
      <KopSuratModal
        isOpen={isGlobalKopModalOpen && (currentUser?.role === 'admin' || currentUser?.role === 'kasubag')}
        onClose={() => setIsGlobalKopModalOpen(false)}
        isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'kasubag'}
      />
    </div>
  );
}
