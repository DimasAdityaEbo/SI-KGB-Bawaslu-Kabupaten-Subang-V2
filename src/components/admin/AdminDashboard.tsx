import React, { useState } from 'react';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Send,
  ArrowRight,
  TrendingUp,
  Eye,
  Mail,
  ExternalLink,
  Copy,
  Check,
  BellRing,
} from 'lucide-react';
import { Pegawai, PengajuanKGB, PengajuanStatus, EmailDispatchLog } from '../../types';
import {
  sendJadwalReminderEmail,
  generateJadwalReminderPlainText,
  createGmailComposeUrl,
  createMailtoUrl,
} from '../../services/emailService';

interface AdminDashboardProps {
  pegawaiList: Pegawai[];
  pengajuanList: PengajuanKGB[];
  onSelectTab: (tab: string) => void;
  onViewPengajuan: (pengajuan: PengajuanKGB) => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  pegawaiList,
  pengajuanList,
  onSelectTab,
  onViewPengajuan,
  onRefreshData,
}) => {
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [isSendingBatch, setIsSendingBatch] = useState(false);

  // Reminder Success Modal State
  const [reminderSuccessModal, setReminderSuccessModal] = useState<{
    isOpen: boolean;
    pegawai: Pegawai;
    emailLog: EmailDispatchLog;
    diffDays: number;
    gmailUrl: string;
    mailtoUrl: string;
    plainText: string;
  } | null>(null);
  const [copiedReminderText, setCopiedReminderText] = useState(false);

  // Status Counts
  const countPending = pengajuanList.filter((p) => p.status === 'menunggu_verifikasi').length;
  const countReview = pengajuanList.filter((p) => p.status === 'dalam_proses').length;
  const countRevision = pengajuanList.filter((p) => p.status === 'perlu_perbaikan').length;
  const countApproved = pengajuanList.filter((p) => p.status === 'disetujui').length;
  const countRejected = pengajuanList.filter((p) => p.status === 'ditolak').length;
  const totalPengajuan = pengajuanList.length;

  // Jadwal pengajuan kenaikan gaji terdekat (< 1 bulan / <= 30 hari)
  const today = new Date();
  const upcomingKgbList = pegawaiList
    .map((p) => {
      const kgbDate = new Date(p.jadwalKgbBerikutnya);
      const diffTime = kgbDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        pegawai: p,
        diffDays,
        isDueWithinMonth: diffDays >= -10 && diffDays <= 30, // within 30 days or freshly due
      };
    })
    .filter((item) => item.isDueWithinMonth)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Handle Kirim Pengingat Email
  const handleSendReminder = async (pegawai: Pegawai, diffDays: number) => {
    setSendingReminderId(pegawai.id);
    try {
      const emailLog = await sendJadwalReminderEmail(pegawai, Math.max(0, diffDays));
      const plainText = generateJadwalReminderPlainText(pegawai, diffDays);
      const gmailUrl = createGmailComposeUrl(pegawai.email, emailLog.subject, plainText);
      const mailtoUrl = createMailtoUrl(pegawai.email, emailLog.subject, plainText);

      onRefreshData();

      setReminderSuccessModal({
        isOpen: true,
        pegawai,
        emailLog,
        diffDays,
        gmailUrl,
        mailtoUrl,
        plainText,
      });
    } catch (e: any) {
      console.error('Error sending reminder:', e);
      alert(`Gagal mengirim pengingat: ${e?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setSendingReminderId(null);
    }
  };

  // Handle Kirim Pengingat ke Semua Pegawai H-30
  const handleSendBatchReminders = async () => {
    if (upcomingKgbList.length === 0) return;
    if (
      !confirm(
        `Kirim pengingat email ke seluruh ${upcomingKgbList.length} pegawai yang jadwal KGB-nya dalam 30 hari ke depan?`
      )
    ) {
      return;
    }

    setIsSendingBatch(true);
    try {
      for (const item of upcomingKgbList) {
        await sendJadwalReminderEmail(item.pegawai, Math.max(0, item.diffDays));
      }
      onRefreshData();
      setReminderSuccess(
        `Berhasil mengirimkan pengingat email ke ${upcomingKgbList.length} pegawai!`
      );
      setTimeout(() => setReminderSuccess(null), 5000);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat mengirim pengingat massal.');
    } finally {
      setIsSendingBatch(false);
    }
  };

  // Status mapping badge helper
  const getStatusBadge = (status: PengajuanStatus) => {
    switch (status) {
      case 'menunggu_verifikasi':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" /> Menunggu Verifikasi
          </span>
        );
      case 'dikirim_ke_provinsi':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 border border-indigo-200">
            <Send className="h-3 w-3 text-indigo-600" /> Berkas Dikirim ke Bawaslu Provinsi
          </span>
        );
      case 'perlu_perbaikan':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3" /> Perlu Perbaikan
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Disetujui
          </span>
        );
      case 'ditolak':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800 border border-red-200">
            <XCircle className="h-3 w-3" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            Dalam Proses
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard Kepegawaian Bawaslu Subang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan pengajuan Kenaikan Gaji Berkala (KGB), monitoring jadwal terdekat, dan statistik pelayanan.
          </p>
        </div>
      </div>

      {reminderSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{reminderSuccess}</span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pegawai */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pegawai</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-slate-900">
              {pegawaiList.length}
            </span>
            <span className="text-xs text-slate-500">Orang</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Terdaftar di Sekretariat Bawaslu Subang
          </p>
        </div>

        {/* Total Pengajuan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengajuan</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-slate-900">
              {totalPengajuan}
            </span>
            <span className="text-xs text-slate-500">Berkas Masuk</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Kumulatif periode aktif berjalan
          </p>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Menunggu Verifikasi</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-amber-950">
              {countPending}
            </span>
            <span className="text-xs text-amber-700">Perlu Tindakan</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80">
            SOP peninjauan 3-5 hari kerja
          </p>
        </div>

        {/* Disetujui & Diterbitkan */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">KGB Disetujui</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-emerald-950">
              {countApproved}
            </span>
            <span className="text-xs text-emerald-700">SK Terbit</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80">
            Telah diterbitkan surat keputusan/rekomendasi
          </p>
        </div>
      </div>

      {/* SECTION 2: GRAFIK STATUS & JADWAL TERDEKAT < 1 BULAN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visual Chart / Breakdown by Status (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Distribusi Status Pengajuan
              </h2>
              <p className="text-[11px] text-slate-500">
                Visualisasi perbandingan status permohonan KGB
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {/* Status Item: Menunggu Verifikasi */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Menunggu Verifikasi
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">
                  {countPending} ({totalPengajuan ? Math.round((countPending / totalPengajuan) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${totalPengajuan ? (countPending / totalPengajuan) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item: Disetujui */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Disetujui
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">
                  {countApproved} ({totalPengajuan ? Math.round((countApproved / totalPengajuan) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${totalPengajuan ? (countApproved / totalPengajuan) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item: Perlu Perbaikan */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  Perlu Perbaikan Berkas
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">
                  {countRevision} ({totalPengajuan ? Math.round((countRevision / totalPengajuan) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${totalPengajuan ? (countRevision / totalPengajuan) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item: Ditolak */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Ditolak
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">
                  {countRejected} ({totalPengajuan ? Math.round((countRejected / totalPengajuan) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${totalPengajuan ? (countRejected / totalPengajuan) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed border border-slate-100">
            Tingkat penyelesaian permohonan KGB saat ini mencapai{' '}
            <strong className="text-slate-900 font-bold font-mono">
              {totalPengajuan ? Math.round((countApproved / totalPengajuan) * 100) : 0}%
            </strong>{' '}
            dari total permohonan yang diajukan oleh pegawai.
          </div>
        </div>

        {/* JADWAL PENGAJUAN KGB TERDEKAT < 1 BULAN (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Jadwal Kenaikan Gaji Terdekat (&lt; 1 Bulan)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pegawai yang masa kerja golongan 2 tahunnya jatuh tempo dalam 30 hari ke depan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {upcomingKgbList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSendBatchReminders}
                  disabled={isSendingBatch}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-700 transition disabled:opacity-50 shadow-xs"
                  title="Kirim pengingat email otomatis ke seluruh pegawai yang jadwalnya jatuh tempo"
                >
                  <BellRing className={`h-3 w-3 ${isSendingBatch ? 'animate-spin' : ''}`} />
                  <span>{isSendingBatch ? 'Mengirim Semua...' : 'Kirim Semua (H-30)'}</span>
                </button>
              )}
              <span className="font-mono-numbers rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                {upcomingKgbList.length} Pegawai
              </span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {upcomingKgbList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada pegawai dengan jadwal KGB dalam kurun waktu &lt; 1 bulan.
              </div>
            ) : (
              upcomingKgbList.map(({ pegawai, diffDays }) => (
                <div key={pegawai.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{pegawai.nama}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono">NIP: {pegawai.nip}</span>
                      <span>·</span>
                      <span>{pegawai.bagianDivisi}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600">
                        Jadwal KGB: <strong className="text-slate-900">{pegawai.jadwalKgbBerikutnya}</strong>
                      </span>
                      <span
                        className={`font-mono-numbers rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          diffDays <= 7
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {diffDays <= 0 ? 'Hari Ini / Jatuh Tempo' : `${diffDays} hari lagi`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendReminder(pegawai, diffDays)}
                    disabled={sendingReminderId === pegawai.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 disabled:opacity-50 transition shadow-2xs"
                    title={`Kirim Pengingat Email ke ${pegawai.email}`}
                  >
                    <Mail className={`h-3.5 w-3.5 text-sky-600 ${sendingReminderId === pegawai.id ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {sendingReminderId === pegawai.id ? 'Mengirim...' : 'Kirim Pengingat Email'}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: PENGAJUAN TERBARU TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pengajuan Kenaikan Gaji Terbaru
            </h2>
            <p className="text-[11px] text-slate-500">
              Daftar berkas permohonan yang baru masuk dan membutuhkan tindak lanjut verifikasi
            </p>
          </div>
          <button
            onClick={() => onSelectTab('pengajuan')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Semua Pengajuan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="pb-2 font-semibold">No. Registrasi</th>
                <th className="pb-2 font-semibold">Nama Pemohon</th>
                <th className="pb-2 font-semibold">Divisi</th>
                <th className="pb-2 font-semibold">Tanggal Diajukan</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pengajuanList.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 font-mono font-medium text-slate-900">
                    {item.noPengajuan}
                  </td>
                  <td className="py-3">
                    <p className="font-bold text-slate-900">{item.namaPemohon}</p>
                    <p className="text-[11px] text-slate-400 font-mono">NIP. {item.nipPemohon}</p>
                  </td>
                  <td className="py-3 text-slate-600 max-w-xs truncate">
                    {item.divisiPemohon}
                  </td>
                  <td className="py-3 text-slate-600">
                    {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3">{getStatusBadge(item.status)}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onViewPengajuan(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMINDER EMAIL SUCCESS MODAL */}
      {reminderSuccessModal && reminderSuccessModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-amber-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-snug">
                    Pengingat KGB Terkirim ke Email Pegawai
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Notifikasi resmi H-30 telah diproses dan dicatat dalam sistem
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status Pengiriman:</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Check className="h-3 w-3" /> Berhasil Dikirim (Delivered)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Penerima (Pegawai):</span>
                  <span className="font-semibold text-slate-900">
                    {reminderSuccessModal.pegawai.nama}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Alamat Email:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {reminderSuccessModal.pegawai.email}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Jadwal TMT KGB:</span>
                  <span className="font-semibold text-amber-800 font-mono">
                    {reminderSuccessModal.pegawai.jadwalKgbBerikutnya} ({reminderSuccessModal.diffDays <= 0 ? 'Jatuh Tempo' : `${reminderSuccessModal.diffDays} hari lagi`})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block mb-0.5">Subjek Notifikasi:</span>
                  <span className="font-semibold text-slate-800 text-[11px] leading-tight block">
                    {reminderSuccessModal.emailLog.subject}
                  </span>
                </div>
              </div>

              {/* Action Triggers */}
              <div>
                <p className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>Kirim Langsung dari Akun Email Anda:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={reminderSuccessModal.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                  >
                    <span>Buka di Gmail Web</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href={reminderSuccessModal.mailtoUrl}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <span>Aplikasi Email Default</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Copy Text */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(reminderSuccessModal.plainText);
                    setCopiedReminderText(true);
                    setTimeout(() => setCopiedReminderText(false), 2500);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {copiedReminderText ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Pesan Pengingat Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin Naskah Pengingat Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setReminderSuccessModal(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
