import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  Download,
  Printer,
  Send,
  X,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Trash2,
  Upload,
} from 'lucide-react';
import { PengajuanKGB, Pegawai, PengajuanStatus, DokumenLampiran, EmailDispatchLog } from '../../types';
import { savePengajuan, savePegawai, deletePengajuan } from '../../services/storage';
import {
  sendKgbStatusEmail,
  generateKgbEmailPlainText,
  createGmailComposeUrl,
  createMailtoUrl,
} from '../../services/emailService';
import { PrintDocumentModal } from '../PrintDocumentModal';
import { DocumentViewerModal } from '../DocumentViewerModal';
import { downloadDokumenFile, readFileAsDataUrl } from '../../services/documentUtils';

interface DaftarPengajuanProps {
  pengajuanList: PengajuanKGB[];
  pegawaiList: Pegawai[];
  onRefreshData: () => void;
  selectedPengajuanFromDashboard?: PengajuanKGB | null;
  onClearSelectedPengajuan?: () => void;
}

export const DaftarPengajuan: React.FC<DaftarPengajuanProps> = ({
  pengajuanList,
  pegawaiList,
  onRefreshData,
  selectedPengajuanFromDashboard,
  onClearSelectedPengajuan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePengajuan, setActivePengajuan] = useState<PengajuanKGB | null>(
    selectedPengajuanFromDashboard || null
  );

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<DokumenLampiran | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Verification state in modal
  const [newStatus, setNewStatus] = useState<PengajuanStatus>('disetujui');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [nomorSk, setNomorSk] = useState('');
  const [fileSkDiterbitkan, setFileSkDiterbitkan] = useState<File | null>(null);
  const [existingSkDoc, setExistingSkDoc] = useState<DokumenLampiran | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Email Success Modal State
  const [emailSuccessModal, setEmailSuccessModal] = useState<{
    isOpen: boolean;
    emailLog: EmailDispatchLog;
    plainText: string;
    gmailUrl: string;
    mailtoUrl: string;
    updatedPengajuan: PengajuanKGB;
    nextJadwalKgb?: string;
  } | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState(false);

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'surat_pengantar' | 'tanda_terima' | 'sk_kgb' | 'disposisi'>('surat_pengantar');

  // Delete pengajuan state
  const [deleteTarget, setDeleteTarget] = useState<PengajuanKGB | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePengajuan(deleteTarget.id);
      if (activePengajuan?.id === deleteTarget.id) {
        setActivePengajuan(null);
      }
      setDeleteTarget(null);
      onRefreshData();
    } catch (err: any) {
      console.error('Error deleting pengajuan:', err);
      alert(`Gagal menghapus pengajuan: ${err?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDetail = (item: PengajuanKGB) => {
    setActivePengajuan(item);
    setNewStatus(item.status);
    setCatatanVerifikasi(item.catatanVerifikator || '');
    setNomorSk(
      item.nomorSkKgbDiterbitkan ||
        `045.2/KP.04.00/JB-22/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
    );
    setFileSkDiterbitkan(null);
    setExistingSkDoc(item.dokumenSkKgbDiterbitkan);
  };

  const handleCloseDetail = () => {
    setActivePengajuan(null);
    setFileSkDiterbitkan(null);
    setExistingSkDoc(undefined);
    if (onClearSelectedPengajuan) onClearSelectedPengajuan();
  };

  const handleSaveVerification = async () => {
    if (!activePengajuan) return;

    if (newStatus === 'perlu_perbaikan' && !catatanVerifikasi.trim()) {
      alert('Harap isi catatan perbaikan dokumen untuk pemohon.');
      return;
    }

    setIsUpdating(true);
    try {
      // Process uploaded SK document if approved
      let skKgbDoc: DokumenLampiran | undefined = existingSkDoc;
      if (newStatus === 'disetujui') {
        if (fileSkDiterbitkan) {
          const fileData = await readFileAsDataUrl(fileSkDiterbitkan);
          skKgbDoc = {
            id: `sk-kgb-resmi-${Date.now()}`,
            namaFile: fileSkDiterbitkan.name,
            jenisDokumen: 'sk_kgb',
            tipeFile: fileSkDiterbitkan.type || 'application/pdf',
            ukuranFile: `${(fileSkDiterbitkan.size / (1024 * 1024)).toFixed(2)} MB`,
            fileData,
            uploadedAt: new Date().toISOString(),
          };
        }
      } else {
        skKgbDoc = undefined;
      }

      const updated: PengajuanKGB = {
        ...activePengajuan,
        status: newStatus,
        catatanVerifikator: catatanVerifikasi.trim() || undefined,
        diverifikasiOleh: 'Kepala Sub Bagian Administrasi Bawaslu Subang',
        tanggalVerifikasi: new Date().toISOString(),
        nomorSkKgbDiterbitkan: newStatus === 'disetujui' ? nomorSk : undefined,
        tanggalSkDiterbitkan:
          newStatus === 'disetujui'
            ? activePengajuan.tanggalSkDiterbitkan || new Date().toISOString().split('T')[0]
            : undefined,
        dokumenSkKgbDiterbitkan: newStatus === 'disetujui' ? skKgbDoc : undefined,
      };

      // 1. Save data pengajuan safely
      await savePengajuan(updated);

      // 2. Jika disetujui, perbarui jadwal KGB berikutnya milik pegawai menjadi 2 tahun setelah TMT KGB disetujui!
      let nextKgbFormatted: string | undefined = undefined;
      if (newStatus === 'disetujui') {
        const targetPegawai = pegawaiList.find((p) => p.id === activePengajuan.pegawaiId);
        if (targetPegawai) {
          let baseYear: number;
          let baseMonth: number;
          let baseDay: number;

          // Ambil acuan dari tmtKgbBaru jika format YYYY-MM-DD valid, jika tidak gunakan tanggal hari ini
          if (activePengajuan.tmtKgbBaru && activePengajuan.tmtKgbBaru.includes('-')) {
            const parts = activePengajuan.tmtKgbBaru.split('-').map(Number);
            baseYear = parts[0];
            baseMonth = parts[1];
            baseDay = parts[2] || 1;
          } else {
            const now = new Date();
            baseYear = now.getFullYear();
            baseMonth = now.getMonth() + 1;
            baseDay = now.getDate();
          }

          // Majukan tepat 2 tahun ke depan
          const nextYear = baseYear + 2;
          const nextMonthStr = String(baseMonth).padStart(2, '0');
          const nextDayStr = String(baseDay).padStart(2, '0');
          nextKgbFormatted = `${nextYear}-${nextMonthStr}-${nextDayStr}`;

          const updatedPegawai: Pegawai = {
            ...targetPegawai,
            jadwalKgbBerikutnya: nextKgbFormatted,
            gajiPokokTerakhir: activePengajuan.gajiBaruEstimasi || targetPegawai.gajiPokokTerakhir,
            updatedAt: new Date().toISOString(),
          };

          await savePegawai(updatedPegawai);
        }
      }

      // 3. Dispatch email notification and persist dispatch log
      const actionType =
        newStatus === 'disetujui'
          ? 'disetujui'
          : newStatus === 'dikirim_ke_provinsi'
          ? 'dikirim_ke_provinsi'
          : newStatus === 'perlu_perbaikan'
          ? 'perlu_perbaikan'
          : newStatus === 'ditolak'
          ? 'ditolak'
          : 'dibuat';

      const emailLog = await sendKgbStatusEmail(updated, actionType, nextKgbFormatted);

      // 4. Prepare direct Gmail and mailto dispatch links
      const statusLabels: Record<string, string> = {
        disetujui: 'Disetujui (SK Terbit)',
        dikirim_ke_provinsi: 'Berkas Sedang Dikirim ke Bawaslu Provinsi',
        perlu_perbaikan: 'Perlu Perbaikan Dokumen',
        ditolak: 'Ditolak',
        menunggu_verifikasi: 'Menunggu Verifikasi',
        dalam_proses: 'Dalam Proses',
      };

      const plainText = generateKgbEmailPlainText({
        toName: updated.namaPemohon,
        nip: updated.nipPemohon,
        noPengajuan: updated.noPengajuan,
        statusLabel: statusLabels[updated.status] || updated.status,
        message: emailLog.contentSnippet,
        catatan: updated.catatanVerifikator,
        nomorSk: updated.nomorSkKgbDiterbitkan,
        tmtKgb: updated.tmtKgbBaru,
        nextKgbJadwal: nextKgbFormatted,
      });

      const gmailUrl = createGmailComposeUrl(updated.emailPemohon, emailLog.subject, plainText);
      const mailtoUrl = createMailtoUrl(updated.emailPemohon, emailLog.subject, plainText);

      setActivePengajuan(updated);
      onRefreshData();

      // 5. Open Email Success Confirmation Dialog
      setEmailSuccessModal({
        isOpen: true,
        emailLog,
        plainText,
        gmailUrl,
        mailtoUrl,
        updatedPengajuan: updated,
        nextJadwalKgb: nextKgbFormatted,
      });
    } catch (err: any) {
      console.error('Error saving verification:', err);
      alert(`Gagal menyimpan verifikasi: ${err?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenPrint = (mode: 'surat_pengantar' | 'tanda_terima') => {
    setPrintMode(mode);
    setPrintModalOpen(true);
  };

  // Filter list
  const filteredList = pengajuanList.filter((item) => {
    const matchesSearch =
      item.noPengajuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaPemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nipPemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.divisiPemohon.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PengajuanStatus) => {
    switch (status) {
      case 'menunggu_verifikasi':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" /> Menunggu Verifikasi
          </span>
        );
      case 'dikirim_ke_provinsi':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 border border-indigo-200">
            <Send className="h-3 w-3 text-indigo-600" /> Berkas Dikirim ke Bawaslu Provinsi
          </span>
        );
      case 'perlu_perbaikan':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3" /> Perlu Perbaikan
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Disetujui
          </span>
        );
      case 'ditolak':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800 border border-red-200">
            <XCircle className="h-3 w-3" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Dalam Proses
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Daftar Pengajuan Kenaikan Gaji Berkala (KGB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi berkas, persetujuan, penerbitan surat pengantar usulan KGB ke provinsi, dan tanda terima digital.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan No. Pengajuan, nama pemohon, atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Status Pengajuan</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="dikirim_ke_provinsi">Dikirim ke Bawaslu Provinsi</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">No. Pengajuan</th>
                <th className="py-3 px-4 font-semibold">Nama Pemohon & NIP</th>
                <th className="py-3 px-4 font-semibold">Bagian / Divisi</th>
                <th className="py-3 px-4 font-semibold">TMT & Periode</th>
                <th className="py-3 px-4 font-semibold">Tanggal Diajukan</th>
                <th className="py-3 px-4 font-semibold">Status Pengajuan</th>
                <th className="py-3 px-4 font-semibold text-right">Detail & Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada berkas pengajuan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.noPengajuan}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.namaPemohon}</p>
                      <p className="font-mono text-[11px] text-slate-500">NIP. {item.nipPemohon}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {item.divisiPemohon}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{item.periodeKgb}</p>
                      <p className="text-[11px] text-slate-400 font-mono">TMT: {item.tmtKgbBaru}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-100 shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Detail &amp; Verifikasi</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 hover:border-red-300 transition"
                          title={`Hapus Berkas Pengajuan ${item.noPengajuan}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & VERIFIKASI MODAL */}
      {activePengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verifikasi Pengajuan KGB: {activePengajuan.noPengajuan}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pemohon: {activePengajuan.namaPemohon} (NIP: {activePengajuan.nipPemohon})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Data Pemohon</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{activePengajuan.namaPemohon}</p>
                  <p className="font-mono text-slate-600">NIP: {activePengajuan.nipPemohon}</p>
                  <p className="text-slate-600">{activePengajuan.jabatanPemohon}</p>
                  <p className="text-slate-600">{activePengajuan.divisiPemohon}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Kontak & Jadwal</p>
                  <p className="text-slate-700 mt-1">Surel: <span className="font-mono font-semibold">{activePengajuan.emailPemohon}</span></p>
                  <p className="text-slate-700">No. WhatsApp: <span className="font-mono font-semibold">{activePengajuan.noHpPemohon}</span></p>
                  <p className="text-slate-700">Periode KGB: <strong className="text-slate-900">{activePengajuan.periodeKgb}</strong> (TMT: {activePengajuan.tmtKgbBaru})</p>
                  <p className="text-slate-700">Waktu Diajukan: {new Date(activePengajuan.tanggalPengajuan).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Perihal & Catatan Pemohon */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Perihal Permohonan:</p>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-800 font-medium">
                  {activePengajuan.perihal}
                </div>
                {activePengajuan.catatanPemohon && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 italic text-slate-600">
                    "{activePengajuan.catatanPemohon}"
                  </div>
                )}
              </div>

              {/* DOKUMEN PERSYARATAN TERLAMPIR */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Kelengkapan Berkas & Dokumen Terlampir
                </h4>
                <div className={`grid grid-cols-1 ${activePengajuan.dokumenSkKgbDiterbitkan ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
                  {/* SK Pangkat */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sky-700 font-semibold mb-1">
                        <FileCheck className="h-4 w-4" />
                        <span>SK Pangkat Terakhir *</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-medium truncate" title={activePengajuan.skPangkatTerakhir.namaFile}>
                        {activePengajuan.skPangkatTerakhir.namaFile}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activePengajuan.skPangkatTerakhir.ukuranFile}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDoc(activePengajuan.skPangkatTerakhir);
                          setIsDocViewerOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDokumenFile(activePengajuan.skPangkatTerakhir, activePengajuan)}
                        className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        title="Unduh Berkas"
                      >
                        <Download className="h-3 w-3" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  {/* Dokumen SKP */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>SKP / Prestasi Kerja *</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-medium truncate" title={activePengajuan.dokumenSkpPrestasi.namaFile}>
                        {activePengajuan.dokumenSkpPrestasi.namaFile}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activePengajuan.dokumenSkpPrestasi.ukuranFile}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDoc(activePengajuan.dokumenSkpPrestasi);
                          setIsDocViewerOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDokumenFile(activePengajuan.dokumenSkpPrestasi, activePengajuan)}
                        className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        title="Unduh Berkas"
                      >
                        <Download className="h-3 w-3" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  {/* SK KGB Terakhir (Optional) */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                        <FileText className="h-4 w-4" />
                        <span>SK KGB Sebelumnya</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-medium truncate" title={activePengajuan.skGajiBerkalaTerakhir?.namaFile}>
                        {activePengajuan.skGajiBerkalaTerakhir
                          ? activePengajuan.skGajiBerkalaTerakhir.namaFile
                          : 'Tidak dilampirkan (KGB Pertama)'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activePengajuan.skGajiBerkalaTerakhir?.ukuranFile || '-'}
                      </p>
                    </div>
                    {activePengajuan.skGajiBerkalaTerakhir && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (activePengajuan.skGajiBerkalaTerakhir) {
                              setViewingDoc(activePengajuan.skGajiBerkalaTerakhir);
                              setIsDocViewerOpen(true);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Lihat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activePengajuan.skGajiBerkalaTerakhir) {
                              downloadDokumenFile(activePengajuan.skGajiBerkalaTerakhir, activePengajuan);
                            }
                          }}
                          className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          title="Unduh Berkas"
                        >
                          <Download className="h-3 w-3" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SK KGB Resmi Diterbitkan (jika sudah ada) */}
                  {activePengajuan.dokumenSkKgbDiterbitkan && (
                    <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/70 p-3.5 flex flex-col justify-between shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>SK KGB Diterbitkan</span>
                        </div>
                        <p className="text-[11px] text-slate-800 font-medium truncate" title={activePengajuan.dokumenSkKgbDiterbitkan.namaFile}>
                          {activePengajuan.dokumenSkKgbDiterbitkan.namaFile}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          {activePengajuan.dokumenSkKgbDiterbitkan.ukuranFile} • Resmi Diterbitkan
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (activePengajuan.dokumenSkKgbDiterbitkan) {
                              setViewingDoc(activePengajuan.dokumenSkKgbDiterbitkan);
                              setIsDocViewerOpen(true);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-emerald-700 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800 transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Lihat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activePengajuan.dokumenSkKgbDiterbitkan) {
                              downloadDokumenFile(activePengajuan.dokumenSkKgbDiterbitkan, activePengajuan);
                            }
                          }}
                          className="flex items-center justify-center gap-1 rounded border border-emerald-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 transition"
                          title="Unduh SK KGB Resmi"
                        >
                          <Download className="h-3 w-3" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FORM VERIFIKASI ADMIN */}
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Keputusan Verifikasi & Penetapan Status
                </h4>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <label
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center text-center transition ${
                      newStatus === 'disetujui'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="disetujui"
                      checked={newStatus === 'disetujui'}
                      onChange={() => setNewStatus('disetujui')}
                      className="sr-only"
                    />
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
                    <span>Setujui Pengajuan</span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center text-center transition ${
                      newStatus === 'dikirim_ke_provinsi'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="dikirim_ke_provinsi"
                      checked={newStatus === 'dikirim_ke_provinsi'}
                      onChange={() => setNewStatus('dikirim_ke_provinsi')}
                      className="sr-only"
                    />
                    <Send className="h-5 w-5 text-indigo-600 mb-1" />
                    <span>Kirim ke Bawaslu Provinsi</span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center text-center transition ${
                      newStatus === 'perlu_perbaikan'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="perlu_perbaikan"
                      checked={newStatus === 'perlu_perbaikan'}
                      onChange={() => setNewStatus('perlu_perbaikan')}
                      className="sr-only"
                    />
                    <AlertTriangle className="h-5 w-5 text-orange-600 mb-1" />
                    <span>Perlu Perbaikan Berkas</span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center text-center transition ${
                      newStatus === 'ditolak'
                        ? 'border-red-600 bg-red-50 text-red-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="ditolak"
                      checked={newStatus === 'ditolak'}
                      onChange={() => setNewStatus('ditolak')}
                      className="sr-only"
                    />
                    <XCircle className="h-5 w-5 text-red-600 mb-1" />
                    <span>Tolak Pengajuan</span>
                  </label>
                </div>

                {/* If sent to province, show information banner */}
                {newStatus === 'dikirim_ke_provinsi' && (
                  <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3.5 text-xs text-indigo-950">
                    <p className="font-bold flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-indigo-600" />
                      Status: Berkas Sedang Dikirim ke Bawaslu Provinsi Jawa Barat
                    </p>
                    <p className="text-[11px] text-indigo-800 mt-1 leading-relaxed">
                      Status berkas usulan akan diperbarui menjadi &quot;Berkas Sedang Dikirim ke Bawaslu Provinsi&quot;. Pemohon akan menerima notifikasi resmi bahwa berkas telah selesai diverifikasi oleh Kabupaten Subang dan sedang diproses ke Bawaslu Provinsi.
                    </p>
                  </div>
                )}

                {/* If approved, show Nomor SK field & SK Document Upload */}
                {newStatus === 'disetujui' && (
                  <div className="space-y-4 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Nomor Surat Rekomendasi / SK KGB Diterbitkan:
                      </label>
                      <input
                        type="text"
                        value={nomorSk}
                        onChange={(e) => setNomorSk(e.target.value)}
                        placeholder="045.2/KP.04.00/JB-22/10/2026"
                        className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    {/* Upload Dokumen SK KGB Resmi */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-semibold text-emerald-950">
                          Upload Dokumen SK KGB (Resmi):
                        </label>
                        <span className="text-[11px] text-emerald-700">Format: PDF, JPG, PNG (Maks. 10MB)</span>
                      </div>

                      {/* Kasus 1: Ada berkas baru yang baru dipilih */}
                      {fileSkDiterbitkan ? (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-white p-3 shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                              <FileCheck className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-emerald-950 truncate">
                                {fileSkDiterbitkan.name}
                              </p>
                              <p className="text-[11px] text-emerald-700">
                                {(fileSkDiterbitkan.size / (1024 * 1024)).toFixed(2)} MB • Berkas baru siap diunggah &amp; diterbitkan
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFileSkDiterbitkan(null)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition shrink-0 ml-2"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : existingSkDoc ? (
                        /* Kasus 2: Sudah ada dokumen SK sebelumnya */
                        <div className="rounded-lg border border-emerald-300 bg-white p-3 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 mb-0.5">
                                  Dokumen SK Resmi Tersedia
                                </span>
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {existingSkDoc.namaFile}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {existingSkDoc.ukuranFile}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDoc(existingSkDoc);
                                  setIsDocViewerOpen(true);
                                }}
                                className="flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Lihat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadDokumenFile(existingSkDoc, activePengajuan)}
                                className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Download className="h-3 w-3" />
                                <span>Unduh</span>
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">Ingin mengganti berkas SK ini?</span>
                            <label className="cursor-pointer text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline">
                              <span>Pilih Berkas Baru</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setFileSkDiterbitkan(e.target.files[0]);
                                  }
                                }}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        /* Kasus 3: Belum ada file, tampilkan area upload */
                        <label className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-white p-4 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition">
                          <Upload className="h-6 w-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-emerald-950">
                            Pilih atau Tarik Berkas SK KGB ke Sini
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Format PDF, JPG, atau PNG (Maksimal 10MB)
                          </p>
                          <p className="text-[10px] text-emerald-700 font-medium mt-1">
                            Dokumen yang diunggah akan langsung tersedia bagi pegawai di portal SI-KGB
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFileSkDiterbitkan(e.target.files[0]);
                              }
                            }}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Catatan Verifikator */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Catatan Verifikator (Akan dikirimkan ke surel pegawai):
                  </label>
                  <textarea
                    rows={3}
                    value={catatanVerifikasi}
                    onChange={(e) => setCatatanVerifikasi(e.target.value)}
                    placeholder="Tuliskan catatan kelayakan berkas atau instruksi perbaikan bagi pemohon..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-sky-600" />
                    Sistem akan mengirim email resmi real-time ke {activePengajuan.emailPemohon}
                  </span>

                  <button
                    onClick={handleSaveVerification}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    <span>{isUpdating ? 'Memproses...' : 'Simpan & Kirim Notifikasi Email'}</span>
                  </button>
                </div>
              </div>

              {/* ACTION PRINTING & DELETE OPTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(activePengajuan)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition shadow-2xs"
                  title="Hapus berkas permohonan pengajuan KGB ini"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  <span>Hapus Pengajuan</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700 mr-1">Cetak Dokumen:</span>
                  <button
                    onClick={() => {
                      setPrintMode('tanda_terima');
                      setPrintModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    title="Cetak Bukti Tanda Terima Pengajuan Berkas"
                  >
                    <Printer className="h-3.5 w-3.5 text-sky-600" />
                    <span>Tanda Terima</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrintMode('surat_pengantar');
                      setPrintModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800 transition shadow-xs"
                    title="Cetak Surat Pengantar Usulan KGB ke Bawaslu Provinsi"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Surat Pengantar</span>
                  </button>
                  {activePengajuan.status === 'disetujui' && (
                    <button
                      onClick={() => {
                        setPrintMode('sk_kgb');
                        setPrintModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                      title="Cetak Surat Pemberitahuan / SK KGB Resmi"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-600" />
                      <span>SK / Pemberitahuan KGB</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPrintMode('disposisi');
                      setPrintModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    title="Cetak Lembar Disposisi Kasubag Administrasi"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Disposisi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      {activePengajuan && (
        <PrintDocumentModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          pengajuan={activePengajuan}
          pegawai={pegawaiList.find((p) => p.id === activePengajuan.pegawaiId)}
          mode={printMode}
          isAdmin={true}
        />
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        document={viewingDoc}
        pengajuan={activePengajuan || undefined}
      />

      {/* EMAIL SUCCESS CONFIRMATION MODAL */}
      {emailSuccessModal && emailSuccessModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-snug">
                    Verifikasi Disimpan &amp; Notifikasi Email Berhasil
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Data pengajuan diperbarui dan email resmi telah diproses sistem
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Recipient Details Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status Pengiriman:</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Check className="h-3 w-3" /> Berhasil Dikirim (Delivered)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Email Pemohon:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {emailSuccessModal.emailLog.toEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Nama Pemohon:</span>
                  <span className="font-semibold text-slate-900">
                    {emailSuccessModal.emailLog.toName}
                  </span>
                </div>

                {emailSuccessModal.nextJadwalKgb && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 bg-emerald-50/70 -mx-4 px-4 py-2 rounded-md">
                    <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                      Jadwal KGB Berikutnya Diperbarui:
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {emailSuccessModal.nextJadwalKgb} (2 Tahun Mendatang)
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 font-medium block mb-0.5">Subjek Email:</span>
                  <span className="font-semibold text-slate-800 text-[11px] leading-tight block">
                    {emailSuccessModal.emailLog.subject}
                  </span>
                </div>
              </div>

              {/* Email Client Quick Triggers */}
              <div>
                <p className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>Opsi Buka di Peramban / Aplikasi Email:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={emailSuccessModal.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                  >
                    <span>Buka di Gmail Web</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href={emailSuccessModal.mailtoUrl}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <span>Aplikasi Email Default</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Copy Plain Text Preview */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailSuccessModal.plainText);
                    setCopiedEmailText(true);
                    setTimeout(() => setCopiedEmailText(false), 2500);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {copiedEmailText ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Teks Email Berhasil Disalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin Isi Teks Notifikasi Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEmailSuccessModal(null);
                  setActivePengajuan(null);
                }}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
              >
                Selesai &amp; Kembali ke Daftar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS PENGAJUAN ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Hapus Berkas Pengajuan KGB?
                </h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Anda akan menghapus berkas pengajuan <strong>{deleteTarget.noPengajuan}</strong> atas nama <strong>{deleteTarget.namaPemohon}</strong>. Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>NIP Pemohon:</span>
                <span className="font-mono font-semibold text-slate-800">{deleteTarget.nipPemohon}</span>
              </div>
              <div className="flex justify-between">
                <span>Perihal:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.perihal}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Saat Ini:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 transition shadow disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Pengajuan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
