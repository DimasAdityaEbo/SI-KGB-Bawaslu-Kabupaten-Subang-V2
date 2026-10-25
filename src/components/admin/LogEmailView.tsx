import React, { useState } from 'react';
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  X,
  ExternalLink,
  Filter,
  Check,
  RefreshCw,
} from 'lucide-react';
import { EmailDispatchLog, PengajuanKGB } from '../../types';
import { generateKgbEmailHtml, sendKgbStatusEmail } from '../../services/emailService';

interface LogEmailViewProps {
  emailLogs: EmailDispatchLog[];
  pengajuanList: PengajuanKGB[];
  onRefreshLogs: () => void;
}

export const LogEmailView: React.FC<LogEmailViewProps> = ({
  emailLogs,
  pengajuanList,
  onRefreshLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'sent' | 'failed'>('all');
  const [selectedLog, setSelectedLog] = useState<EmailDispatchLog | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      log.toName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.toEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.noPengajuan && log.noPengajuan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePreview = (log: EmailDispatchLog) => {
    setSelectedLog(log);
    const matchingPengajuan = pengajuanList.find(
      (p) => p.id === log.pengajuanId || p.noPengajuan === log.noPengajuan
    );

    const html = generateKgbEmailHtml({
      toName: log.toName,
      nip: matchingPengajuan?.nipPemohon || '199206142019031004',
      noPengajuan: log.noPengajuan || 'KGB/BWS-SBG/2026/001',
      status: matchingPengajuan?.status || 'disetujui',
      statusLabel: matchingPengajuan?.status
        ? matchingPengajuan.status.replace(/_/g, ' ').toUpperCase()
        : 'TERKIRIM',
      statusColor: '#0284c7',
      message: log.contentSnippet,
      catatan: matchingPengajuan?.catatanVerifikator,
      nomorSk: matchingPengajuan?.nomorSkKgbDiterbitkan,
      tmtKgb: matchingPengajuan?.tmtKgbBaru,
    });
    setPreviewHtml(html);
  };

  const handleSendTestEmail = async () => {
    if (pengajuanList.length === 0) {
      setNotificationMsg('Tidak ada data pengajuan untuk uji coba pengiriman email.');
      return;
    }
    setIsSendingTest(true);
    setNotificationMsg(null);
    try {
      const sample = pengajuanList[0];
      await sendKgbStatusEmail(sample, 'dibuat');
      onRefreshLogs();
      setNotificationMsg('Email uji coba berhasil dikirim dan dicatat ke log real-time!');
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (e: any) {
      setNotificationMsg(`Gagal mengirim email: ${e.message || e}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const totalDelivered = emailLogs.filter((e) => e.status === 'delivered').length;
  const totalSent = emailLogs.filter((e) => e.status === 'sent').length;
  const totalFailed = emailLogs.filter((e) => e.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Log Pengiriman Email Notifikasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat lengkap pengiriman pesan notifikasi otomatis perubahan status KGB dan pengingat jadwal kepada pegawai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshLogs}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Refresh Log"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Muat Ulang</span>
          </button>
          <button
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition shadow-xs"
          >
            <Send className={`h-3.5 w-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
            <span>{isSendingTest ? 'Mengirim...' : 'Uji Coba Kirim Email'}</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Metric summary counters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Email Dicatat</p>
          <p className="mt-1 font-mono-numbers text-xl font-bold text-slate-900">{emailLogs.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-emerald-600 font-medium">Terkirim Sukses (Delivered)</p>
          <p className="mt-1 font-mono-numbers text-xl font-bold text-emerald-600">{totalDelivered}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-sky-600 font-medium">Dalam Antrean (Sent)</p>
          <p className="mt-1 font-mono-numbers text-xl font-bold text-sky-600">{totalSent}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-red-500 font-medium">Gagal Dikirim (Failed)</p>
          <p className="mt-1 font-mono-numbers text-xl font-bold text-red-600">{totalFailed}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pegawai, email, atau no pengajuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="delivered">Delivered (Sukses)</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Waktu Dispatch</th>
                <th className="py-3 px-4">Penerima</th>
                <th className="py-3 px-4">Subjek Email</th>
                <th className="py-3 px-4">No. Pengajuan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada catatan log email yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.toName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{log.toEmail}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate" title={log.subject}>
                        {log.subject}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {log.contentSnippet}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {log.noPengajuan || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {log.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> DELIVERED
                        </span>
                      ) : log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                          <Clock className="h-3 w-3 text-sky-600" /> SENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePreview(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Pratinjau</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HTML PREVIEW MODAL */}
      {selectedLog && previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Template HTML Email Resmi Bawaslu
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Kepada: {selectedLog.toName} &lt;{selectedLog.toEmail}&gt;
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setPreviewHtml(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex items-center justify-center">
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                className="w-full h-full max-w-xl rounded-lg bg-white shadow border border-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
