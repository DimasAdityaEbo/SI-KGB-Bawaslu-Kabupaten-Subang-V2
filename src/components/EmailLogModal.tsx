import React, { useState } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Building,
  RefreshCw,
} from 'lucide-react';
import { EmailDispatchLog, PengajuanKGB } from '../types';
import { generateKgbEmailHtml, sendKgbStatusEmail } from '../services/emailService';

interface EmailLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailLogs: EmailDispatchLog[];
  pengajuanList: PengajuanKGB[];
  onRefreshLogs: () => void;
}

export const EmailLogModal: React.FC<EmailLogModalProps> = ({
  isOpen,
  onClose,
  emailLogs,
  pengajuanList,
  onRefreshLogs,
}) => {
  const [selectedLog, setSelectedLog] = useState<EmailDispatchLog | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  if (!isOpen) return null;

  const handlePreviewLog = (log: EmailDispatchLog) => {
    setSelectedLog(log);
    // Find matching pengajuan if any to render rich html preview
    const pengajuan = pengajuanList.find((p) => p.id === log.pengajuanId || p.noPengajuan === log.noPengajuan);

    const html = generateKgbEmailHtml({
      toName: log.toName,
      nip: pengajuan?.nipPemohon || '199206142019031004',
      noPengajuan: log.noPengajuan || 'KGB/BWS-SBG/2026/001',
      status: pengajuan?.status || 'disetujui',
      statusLabel: pengajuan?.status ? pengajuan.status.replace('_', ' ').toUpperCase() : 'TERKIRIM',
      statusColor: '#0284c7',
      message: log.contentSnippet,
      catatan: pengajuan?.catatanVerifikator,
      nomorSk: pengajuan?.nomorSkKgbDiterbitkan,
      tmtKgb: pengajuan?.tmtKgbBaru,
    });
    setPreviewHtml(html);
  };

  const handleSendTestEmail = async () => {
    if (pengajuanList.length === 0) return;
    setIsSendingTest(true);
    try {
      const sample = pengajuanList[0];
      await sendKgbStatusEmail(sample, 'dibuat');
      onRefreshLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Log Pengiriman Email Notifikasi Real-time
              </h3>
              <p className="text-xs text-slate-500">
                Pemberitahuan status KGB otomatis Bawaslu Kabupaten Subang kepada pegawai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
              <span>{isSendingTest ? 'Mengirim...' : 'Kirim Uji Coba Email'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns: Log List & Rendered Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Column 1: Log List */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-4 space-y-2 bg-slate-50/40">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat Terkirim ({emailLogs.length})
              </span>
              <button
                onClick={onRefreshLogs}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada notifikasi email terkirim.
              </div>
            ) : (
              emailLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => handlePreviewLog(log)}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {log.toName}
                      </p>
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Terkirim
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 mt-1 line-clamp-1">
                      {log.subject}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{log.toEmail}</span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Column 2: Email Template Preview */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-slate-100">
            {previewHtml ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto max-w-xl bg-white shadow rounded-lg overflow-hidden border border-slate-200">
                  <div className="bg-slate-200/80 px-4 py-2 border-b border-slate-300 text-[11px] text-slate-700 font-mono flex items-center justify-between">
                    <span>Pratinjau Surel Resmi Bawaslu</span>
                    <span className="text-slate-500">HTML Real-Time Template</span>
                  </div>
                  <div
                    className="p-2"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">Pilih salah satu log email</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Klik item di daftar riwayat untuk melihat pratinjau tampilan surel yang diterima pegawai secara langsung.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-white text-xs text-slate-500">
          <span>Integrasi: Real-Time Dispatcher · Subang Mail System</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
