import React, { useState, useEffect } from 'react';
import {
  FilePlus2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  BookOpen,
  GitPullRequest,
  CheckSquare,
  Clock,
  Award,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Eye,
  Download,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Pegawai, PengajuanKGB, DokumenLampiran, PengajuanStatus } from '../../types';
import { savePengajuan, getPengajuanList } from '../../services/storage';
import { sendKgbStatusEmail } from '../../services/emailService';
import { PrintDocumentModal } from '../PrintDocumentModal';
import { DocumentViewerModal } from '../DocumentViewerModal';
import { readFileAsDataUrl, downloadDokumenFile } from '../../services/documentUtils';

interface AjukanPermohonanProps {
  pegawai: Pegawai;
  pengajuanList?: PengajuanKGB[];
  onRefreshData: () => void;
  onSuccessRedirect: () => void;
  onViewDetailPengajuan?: (pengajuan: PengajuanKGB) => void;
}

export const AjukanPermohonan: React.FC<AjukanPermohonanProps> = ({
  pegawai,
  pengajuanList = [],
  onRefreshData,
  onSuccessRedirect,
  onViewDetailPengajuan,
}) => {
  // Local list fallback if prop is delayed
  const [internalList, setInternalList] = useState<PengajuanKGB[]>(pengajuanList);

  useEffect(() => {
    if (pengajuanList && pengajuanList.length > 0) {
      setInternalList(pengajuanList);
    } else {
      getPengajuanList().then((list) => setInternalList(list));
    }
  }, [pengajuanList]);

  // Filter submissions by this employee, sorted by date descending
  const mySubmissions = [...internalList.filter((p) => p.pegawaiId === pegawai.id)].sort(
    (a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime()
  );

  // An active ongoing submission is any submission that is NOT yet 'disetujui' and NOT yet 'ditolak'
  const activeOngoingPengajuan = mySubmissions.find(
    (p) => p.status !== 'disetujui' && p.status !== 'ditolak'
  );

  // The latest finalized submission (if any)
  const lastFinalizedPengajuan = mySubmissions.find(
    (p) => p.status === 'disetujui' || p.status === 'ditolak'
  );

  // Form fields
  const [perihal, setPerihal] = useState(
    `Permohonan Kenaikan Gaji Berkala (KGB) Periode ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
  );
  const [periodeKgb, setPeriodeKgb] = useState(
    new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  );
  const [tmtKgbBaru, setTmtKgbBaru] = useState(pegawai.jadwalKgbBerikutnya || '2026-10-01');
  const [catatanPemohon, setCatatanPemohon] = useState('');

  // Uploaded files states
  const [fileSkPangkat, setFileSkPangkat] = useState<File | null>(null);
  const [fileSkKgb, setFileSkKgb] = useState<File | null>(null);
  const [fileSkpPrestasi, setFileSkpPrestasi] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [notificationWarning, setNotificationWarning] = useState<string | null>(null);
  const [submittedPengajuan, setSubmittedPengajuan] = useState<PengajuanKGB | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activePrintTarget, setActivePrintTarget] = useState<PengajuanKGB | null>(null);

  // Document preview modal
  const [viewingDoc, setViewingDoc] = useState<DokumenLampiran | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Active info tab
  const [activeInfoTab, setActiveInfoTab] = useState<'dasar_hukum' | 'alur' | 'persyaratan' | 'waktu' | 'produk'>('dasar_hukum');

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);
    setNotificationWarning(null);
    try {
      // Re-check against the latest database state to prevent duplicate submissions.
      const freshList = await getPengajuanList();
      const freshOngoing = freshList.find(
        (p) => p.pegawaiId === pegawai.id && p.status !== 'disetujui' && p.status !== 'ditolak'
      );
      if (freshOngoing) {
        setInternalList(freshList);
        alert(
          `Permohonan tidak dapat dikirim.\n\nAnda masih memiliki pengajuan KGB yang sedang dalam proses verifikasi (No. Registrasi: ${freshOngoing.noPengajuan}).\n\nPegawai hanya dapat mengajukan KGB baru setelah pengajuan sebelumnya telah Disetujui atau Ditolak.`
        );
        return;
      }

      if (!fileSkPangkat) {
        alert('Harap unggah SK Kenaikan Pangkat terakhir Anda.');
        return;
      }
      if (!fileSkpPrestasi) {
        alert('Harap unggah Dokumen Penilaian Prestasi Kerja (SKP) terakhir Anda.');
        return;
      }

      const ticketNumber = `KGB/BWS-SBG/${new Date().getFullYear()}/${String(
        Math.floor(Math.random() * 900) + 100
      )}`;

      // Read real binary data from uploaded files
      const [skPangkatData, skpData, skKgbData] = await Promise.all([
        readFileAsDataUrl(fileSkPangkat),
        readFileAsDataUrl(fileSkpPrestasi),
        fileSkKgb ? readFileAsDataUrl(fileSkKgb) : Promise.resolve(undefined),
      ]);

      const skPangkatDoc: DokumenLampiran = {
        id: `doc-pangkat-${Date.now()}`,
        namaFile: fileSkPangkat.name,
        jenisDokumen: 'sk_pangkat',
        tipeFile: fileSkPangkat.type || 'application/pdf',
        ukuranFile: `${(fileSkPangkat.size / (1024 * 1024)).toFixed(2)} MB`,
        fileData: skPangkatData,
        uploadedAt: new Date().toISOString(),
      };

      const skpDoc: DokumenLampiran = {
        id: `doc-skp-${Date.now()}`,
        namaFile: fileSkpPrestasi.name,
        jenisDokumen: 'skp_prestasi',
        tipeFile: fileSkpPrestasi.type || 'application/pdf',
        ukuranFile: `${(fileSkpPrestasi.size / (1024 * 1024)).toFixed(2)} MB`,
        fileData: skpData,
        uploadedAt: new Date().toISOString(),
      };

      let skKgbDoc: DokumenLampiran | undefined = undefined;
      if (fileSkKgb) {
        skKgbDoc = {
          id: `doc-kgb-${Date.now()}`,
          namaFile: fileSkKgb.name,
          jenisDokumen: 'sk_kgb',
          tipeFile: fileSkKgb.type || 'application/pdf',
          ukuranFile: `${(fileSkKgb.size / (1024 * 1024)).toFixed(2)} MB`,
          fileData: skKgbData,
          uploadedAt: new Date().toISOString(),
        };
      }

      const newPengajuan: PengajuanKGB = {
        id: `kgb-${Date.now()}`,
        noPengajuan: ticketNumber,
        pegawaiId: pegawai.id,
        namaPemohon: pegawai.nama,
        nipPemohon: pegawai.nip,
        jabatanPemohon: pegawai.jabatan,
        divisiPemohon: pegawai.bagianDivisi,
        emailPemohon: pegawai.email,
        noHpPemohon: pegawai.noHp,
        perihal: perihal.trim(),
        periodeKgb: periodeKgb.trim(),
        tmtKgbBaru: tmtKgbBaru,
        gajiLama: pegawai.gajiPokokTerakhir || 3820000,
        gajiBaruEstimasi: (pegawai.gajiPokokTerakhir || 3820000) + 160000,
        skPangkatTerakhir: skPangkatDoc,
        skGajiBerkalaTerakhir: skKgbDoc,
        dokumenSkpPrestasi: skpDoc,
        catatanPemohon: catatanPemohon.trim() || undefined,
        status: 'menunggu_verifikasi',
        tanggalPengajuan: new Date().toISOString(),
      };

      // Save to storage/Supabase
      await savePengajuan(newPengajuan);

      setSubmittedPengajuan(newPengajuan);
      setActivePrintTarget(newPengajuan);
      onRefreshData();

      // Notifications are follow-up actions and must not turn a saved submission
      // into a false failure from the employee's perspective.
      try {
        await sendKgbStatusEmail(newPengajuan, 'dibuat');
        setNotificationWarning(null);
      } catch (notificationError) {
        console.error('Pengajuan saved, but notification dispatch failed:', notificationError);
        setNotificationWarning(
          notificationError instanceof Error
            ? `Permohonan sudah tersimpan, tetapi notifikasi gagal dikirim: ${notificationError.message}`
            : 'Permohonan sudah tersimpan, tetapi notifikasi gagal dikirim.'
        );
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setSubmissionError(
        message.includes('23503')
          ? 'Data pegawai belum tersedia pada database Supabase. Minta administrator menyinkronkan data pegawai terlebih dahulu.'
          : message.includes('42703') || message.includes('does not exist')
          ? `Skema tabel Supabase belum sesuai. Hubungi administrator untuk menjalankan SQL migrasi database. Detail: ${message}`
          : `Permohonan gagal disimpan ke database: ${message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PengajuanStatus) => {
    switch (status) {
      case 'disetujui':
        return {
          label: 'Disetujui',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'Permohonan KGB Anda telah disetujui dan SK resmi telah diterbitkan.',
        };
      case 'dikirim_ke_provinsi':
        return {
          label: 'Dikirim ke Bawaslu Provinsi',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          desc: 'Berkas telah divalidasi Bawaslu Kabupaten Subang dan telah dikirimkan ke Bawaslu Provinsi Jawa Barat.',
        };
      case 'menunggu_verifikasi':
        return {
          label: 'Menunggu Verifikasi',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          desc: 'Berkas masuk ke sistem dan sedang dalam antrean verifikasi oleh Sub Bagian Administrasi & Kepegawaian.',
        };
      case 'dalam_proses':
        return {
          label: 'Dalam Proses Verifikasi',
          bg: 'bg-sky-100 text-sky-900 border-sky-300',
          desc: 'Petugas kepegawaian sedang memeriksa kelengkapan berkas dan menghitung masa kerja golongan.',
        };
      case 'perlu_perbaikan':
        return {
          label: 'Perlu Perbaikan Dokumen',
          bg: 'bg-orange-100 text-orange-900 border-orange-300',
          desc: 'Terdapat dokumen yang perlu diperbaiki atau dilengkapi sesuai instruksi verifikator.',
        };
      case 'ditolak':
        return {
          label: 'Ditolak',
          bg: 'bg-red-100 text-red-900 border-red-300',
          desc: 'Pengajuan ditolak oleh verifikator karena belum memenuhi syarat masa kerja atau kriteria regulasi.',
        };
      default:
        return {
          label: 'Diproses',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          desc: 'Berkas sedang diproses oleh tim kepegawaian.',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Formulir Pengajuan Kenaikan Gaji Berkala (KGB)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Badan Pengawas Pemilihan Umum Kabupaten Subang · Layanan Digitalisasi Kepegawaian
            </p>
          </div>
          {activeOngoingPengajuan && (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              <span>Pengajuan Aktif Sedang Diproses</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Container (Form OR Restriction Card), Right Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* CASE 1: ONGOING SUBMISSION EXISTS -> RESTRICTION SCREEN      */}
        {/* Pegawai hanya dapat mengajukan KGB lagi saat pengajuan        */}
        {/* sebelumnya sudah disetujui atau ditolak                      */}
        {/* ============================================================ */}
        {activeOngoingPengajuan ? (
          <div className="lg:col-span-7 space-y-5">
            {/* Alert Banner Menjelaskan Pembatasan */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-200 p-2 text-amber-900 shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-amber-950">
                    Pengajuan KGB Sebelumnya Masih Dalam Proses
                  </h2>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    Sesuai dengan ketentuan kepegawaian Bawaslu, Anda <strong>hanya dapat mengajukan permohonan KGB lagi saat pengajuan KGB sebelumnya sudah disetujui atau ditolak</strong> oleh verifikator kepegawaian.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white/80 border border-amber-200/90 p-3 text-xs text-amber-900">
                <p className="font-semibold text-slate-900">
                  Status Pengajuan Berjalan Anda Saat Ini:
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {activeOngoingPengajuan.noPengajuan}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 font-bold border text-xs ${
                      getStatusBadge(activeOngoingPengajuan.status).bg
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {getStatusBadge(activeOngoingPengajuan.status).label}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  {getStatusBadge(activeOngoingPengajuan.status).desc}
                </p>
              </div>
            </div>

            {/* Detailed Ongoing Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rincian Berkas Aktif
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeOngoingPengajuan.perihal}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Waktu Pengajuan: {new Date(activeOngoingPengajuan.tanggalPengajuan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </p>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Periode KGB</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeOngoingPengajuan.periodeKgb}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TMT Yang Diajukan</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{activeOngoingPengajuan.tmtKgbBaru}</p>
                </div>
              </div>

              {/* Stepper Progres */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-bold text-slate-900 mb-3 text-center text-xs">
                  Tahapan Penanganan Berkas
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      ✓
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">1. Diajukan</span>
                    <span className="text-[10px] text-slate-500">Berkas Diterima</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                        activeOngoingPengajuan.status === 'disetujui' ||
                        activeOngoingPengajuan.status === 'dikirim_ke_provinsi'
                          ? 'bg-emerald-600 text-white'
                          : activeOngoingPengajuan.status === 'perlu_perbaikan'
                          ? 'bg-orange-500 text-white'
                          : activeOngoingPengajuan.status === 'ditolak'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {activeOngoingPengajuan.status === 'disetujui' ||
                      activeOngoingPengajuan.status === 'dikirim_ke_provinsi'
                        ? '✓'
                        : '2'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">2. Verifikasi</span>
                    <span className="text-[10px] text-slate-500">
                      {activeOngoingPengajuan.status === 'perlu_perbaikan'
                        ? 'Perlu Perbaikan'
                        : 'Staf Subang'}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                        activeOngoingPengajuan.status === 'disetujui'
                          ? 'bg-emerald-600 text-white'
                          : activeOngoingPengajuan.status === 'dikirim_ke_provinsi'
                          ? 'bg-indigo-600 text-white animate-pulse ring-2 ring-indigo-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {activeOngoingPengajuan.status === 'disetujui' ? '✓' : '3'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">3. Usulan Provinsi</span>
                    <span className="text-[10px] text-slate-500">
                      {activeOngoingPengajuan.status === 'dikirim_ke_provinsi'
                        ? 'Telah Dikirim'
                        : 'Bawaslu Jabar'}
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                        activeOngoingPengajuan.status === 'disetujui'
                          ? 'bg-emerald-600 text-white'
                          : activeOngoingPengajuan.status === 'ditolak'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {activeOngoingPengajuan.status === 'disetujui' ? '✓' : '4'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">4. Hasil SK</span>
                    <span className="text-[10px] text-slate-500">
                      {activeOngoingPengajuan.status === 'disetujui'
                        ? 'SK Terbit'
                        : activeOngoingPengajuan.status === 'ditolak'
                        ? 'Ditolak'
                        : 'Penetapan SK'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Verifikator jika ada */}
              {activeOngoingPengajuan.catatanVerifikator && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Catatan dari Tim Verifikator Kepegawaian:
                  </span>
                  <p className="italic text-slate-700">"{activeOngoingPengajuan.catatanVerifikator}"</p>
                </div>
              )}

              {/* Dokumen Lampiran yang telah diunggah */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Berkas Lampiran yang Diunggah:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">SK Pangkat Terakhir</p>
                        <p className="text-[10px] text-slate-500 truncate">{activeOngoingPengajuan.skPangkatTerakhir.namaFile}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingDoc(activeOngoingPengajuan.skPangkatTerakhir);
                        setIsDocViewerOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Lihat berkas"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">SKP 2 Tahun Terakhir</p>
                        <p className="text-[10px] text-slate-500 truncate">{activeOngoingPengajuan.dokumenSkpPrestasi.namaFile}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingDoc(activeOngoingPengajuan.dokumenSkpPrestasi);
                        setIsDocViewerOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Lihat berkas"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActivePrintTarget(activeOngoingPengajuan);
                    setPrintModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Tanda Terima</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewDetailPengajuan) {
                        onViewDetailPengajuan(activeOngoingPengajuan);
                      } else {
                        onSuccessRedirect();
                      }
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
                  >
                    <span>Buka Riwayat &amp; Detail Pengajuan</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CASE 2: NO ONGOING SUBMISSION -> FORM IS OPEN TO SUBMIT      */
          /* (Either first submission OR previous were approved/rejected) */
          /* ============================================================ */
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            {/* Previous Status Announcement (if last submission was approved or rejected) */}
            {lastFinalizedPengajuan && (
              <div
                className={`rounded-lg p-3 text-xs border flex items-start gap-2.5 ${
                  lastFinalizedPengajuan.status === 'disetujui'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {lastFinalizedPengajuan.status === 'disetujui' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-relaxed">
                  <strong className="block text-slate-900">
                    Pengajuan Sebelumnya ({lastFinalizedPengajuan.noPengajuan}):{' '}
                    <span className="uppercase font-bold">
                      {lastFinalizedPengajuan.status === 'disetujui' ? 'Telah Disetujui' : 'Telah Ditolak'}
                    </span>
                  </strong>
                  {lastFinalizedPengajuan.status === 'disetujui' ? (
                    <span>
                      SK KGB sebelumnya diterbitkan dengan Nomor:{' '}
                      <strong className="font-mono">{lastFinalizedPengajuan.nomorSkKgbDiterbitkan || '-'}</strong>.
                      Anda memenuhi syarat mengajukan permohonan KGB untuk periode masa kerja berikutnya.
                    </span>
                  ) : (
                    <span>
                      Pengajuan sebelumnya berstatus Ditolak. Anda diperbolehkan mengajukan permohonan baru dengan melengkapi dan memperbaiki berkas yang dipersyaratkan.
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {submissionError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="leading-relaxed">{submissionError}</p>
                </div>
              )}
              {/* Auto-filled Badge Header */}
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sky-900 leading-relaxed">
                <span className="font-bold block text-sky-950">Data Otomatis Terhubung ke Database:</span>
                Kolom <strong>Nama Lengkap</strong>, <strong>No. HP / WhatsApp</strong>, dan <strong>Email Resmi</strong> terisi secara otomatis sesuai data kepegawaian Anda di database Bawaslu Subang.
              </div>

              {/* THREE AUTO-FILLED FIELDS */}
              <div className="space-y-3 pt-1">
                {/* Field 1: Nama Lengkap */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nama Lengkap Pemohon (Terisi Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={pegawai.nama}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700 cursor-not-allowed"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                    NIP: {pegawai.nip} · {pegawai.jabatan}
                  </p>
                </div>

                {/* Field 2: No HP */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    No. HP / WhatsApp Pemohon (Terisi Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={pegawai.noHp}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-medium text-slate-700 cursor-not-allowed"
                  />
                </div>

                {/* Field 3: Email */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Email Pemohon (Terisi Otomatis)
                  </label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={pegawai.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-medium text-slate-700 cursor-not-allowed"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Notifikasi pembaruan status pengajuan akan dikirimkan secara real-time ke surel ini.
                  </p>
                </div>
              </div>

              {/* Field Perihal */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-800 mb-1">
                  Perihal Pengajuan *
                </label>
                <input
                  type="text"
                  required
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Permohonan Kenaikan Gaji Berkala (KGB) Periode Oktober 2026"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* Periode & TMT Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Periode Kenaikan Gaji *
                  </label>
                  <input
                    type="text"
                    required
                    value={periodeKgb}
                    onChange={(e) => setPeriodeKgb(e.target.value)}
                    placeholder="Oktober 2026"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    TMT KGB Yang Diajukan *
                  </label>
                  <input
                    type="date"
                    required
                    value={tmtKgbBaru}
                    onChange={(e) => setTmtKgbBaru(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* FILE UPLOAD SECTION */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Unggah Berkas Lampiran Persyaratan
                </h3>

                {/* Upload 1: SK Kenaikan Pangkat Terakhir (WAJIB) */}
                <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <label className="block font-semibold text-slate-800 mb-1">
                    1. Upload SK Kenaikan Pangkat Terakhir <span className="text-red-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Format PDF atau gambar scan yang telah dilegalisir / scan dokumen asli (Maks. 5 MB)
                  </p>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFileSkPangkat)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                  {fileSkPangkat && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      File terpilih: {fileSkPangkat.name} ({(fileSkPangkat.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Upload 2: SK Kenaikan Gaji Berkala Terakhir (Opsional bila ada) */}
                <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <label className="block font-semibold text-slate-800 mb-1">
                    2. Upload SK Kenaikan Gaji Berkala (KGB) Terakhir
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Opsional jika sudah pernah menerima KGB sebelumnya (Maks. 5 MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFileSkKgb)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                  {fileSkKgb && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      File terpilih: {fileSkKgb.name} ({(fileSkKgb.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Upload 3: Dokumen Penilaian Prestasi Kerja (SKP) (WAJIB) */}
                <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <label className="block font-semibold text-slate-800 mb-1">
                    3. Upload SKP (Penilaian Prestasi Kerja) 2 Tahun Terakhir <span className="text-red-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Lembar SKP dengan nilai predikat kinerja sekurang-kurangnya bernilai "Baik" (Maks. 5 MB)
                  </p>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFileSkpPrestasi)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                  {fileSkpPrestasi && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      File terpilih: {fileSkpPrestasi.name} ({(fileSkpPrestasi.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan Pemohon */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Catatan Tambahan Pemohon (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatanPemohon}
                  onChange={(e) => setCatatanPemohon(e.target.value)}
                  placeholder="Tuliskan keterangan tambahan bila ada dokumen yang diperbarui..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Mengirimkan Berkas...' : 'Kirim Permohonan KGB Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INFORMATION SECTION ACCORDION / TABS (Always visible on right) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="border-b border-slate-200 pb-2.5 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-600" />
                <span>Layanan Kenaikan Gaji Berkala (KGB) ASN</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bawaslu Kabupaten Subang · Standar Pelayanan Publik
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveInfoTab('dasar_hukum')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'dasar_hukum'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dasar Hukum
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('alur')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'alur'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Alur Layanan (9 Tahap)
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('persyaratan')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'persyaratan'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Persyaratan
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('waktu')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'waktu'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Waktu &amp; Produk
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 text-xs leading-relaxed text-slate-700">
              {activeInfoTab === 'dasar_hukum' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                    DASAR HUKUM:
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Undang-Undang Nomor 25 Tahun 2009</strong> tentang Pelayanan Publik
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Undang-Undang Nomor 20 Tahun 2023</strong> tentang Aparatur Sipil Negara
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Peraturan Pemerintah Nomor 17 Tahun 2020</strong> tentang Perubahan atas Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Peraturan Pemerintah Nomor 5 Tahun 2024</strong> tentang Perubahan Kesembilanbelas atas Peraturan Pemerintah Nomor 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {activeInfoTab === 'alur' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <GitPullRequest className="h-3.5 w-3.5 text-sky-600" />
                    ALUR LAYANAN KENAIKAN GAJI BERKALA:
                  </p>
                  <ol className="space-y-2.5 border-l-2 border-slate-200 pl-3">
                    <li>
                      <span className="font-bold text-slate-900 block">1. Notifikasi H-30</span>
                      <p className="text-[11px] text-slate-600">Pegawai menerima Notifikasi Pengingat Kenaikan Gaji Berkala H-30.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">2. Verifikasi Data Usulan</span>
                      <p className="text-[11px] text-slate-600">Bagian Sumber Daya Manusia Bawaslu Subang memverifikasi data usulan.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">3. Pembuatan Usulan ke Bawaslu Provinsi</span>
                      <p className="text-[11px] text-slate-600">Bagian Sumber Daya Manusia Bawaslu Subang membuat usulan Kenaikan Gaji Berkala kepada Bawaslu Provinsi Jawa Barat.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">4. Pemrosesan Usulan</span>
                      <p className="text-[11px] text-slate-600">Bawaslu Provinsi Jawa Barat memproses usulan Kenaikan Gaji Berkala.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">5. Penerbitan SK KGB</span>
                      <p className="text-[11px] text-slate-600">Penerbitan SK KGB resmi.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">6. Pengiriman SK KGB</span>
                      <p className="text-[11px] text-slate-600">Pengiriman SK KGB yang telah ditandatangani oleh pejabat yang berwenang melalui Bagian SDM Bawaslu Subang untuk disampaikan kepada ASN yang bersangkutan.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">7. Penyampaian SK KGB</span>
                      <p className="text-[11px] text-slate-600">Penyampaian SK KGB kepada ASN.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">8. Pemberitahuan ke Bagian Keuangan</span>
                      <p className="text-[11px] text-slate-600">Pemberitahuan kepada Bagian Keuangan Bawaslu Subang untuk kemudian dilakukan sinkronisasi data KGB terbaru sebagai dasar penyesuaian pembayaran gaji.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">9. Pembayaran Gaji</span>
                      <p className="text-[11px] text-slate-600">Pembayaran gaji sesuai dengan SK KGB terbaru.</p>
                    </li>
                  </ol>
                </div>
              )}

              {activeInfoTab === 'persyaratan' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    PERSYARATAN:
                  </p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">Sasaran Kinerja Pegawai (SKP) 2 tahun Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Nilai predikat kinerja minimal baik dalam kurun waktu 2 tahun.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">Surat Kenaikan Gaji Berkala Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Salinan SK KGB sebelumnya bila sudah pernah menerima kenaikan.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">SK Kenaikan Pangkat Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Salinan sah SK Pangkat terakhir yang telah dilegalisir / scan asli.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {activeInfoTab === 'waktu' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      WAKTU PELAYANAN:
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 font-mono">
                      7 (tujuh) Hari Kerja
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terhitung sejak berkas usulan diterima dan dinyatakan lengkap.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      PRODUK LAYANAN:
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      Surat Usulan Kenaikan Gaji Berkala
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                      BIAYA:
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-800">
                      Gratis (Rp 0,-)
                    </p>
                    <p className="text-[11px] text-emerald-700/80">
                      Seluruh pelayanan kepegawaian tidak dipungut biaya apa pun.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedPengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Permohonan KGB Berhasil Dikirimkan!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Nomor Registrasi: <span className="font-mono font-bold text-slate-900">{submittedPengajuan.noPengajuan}</span>
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Permohonan telah tersimpan. Berkas Anda akan segera diverifikasi oleh tim kepegawaian Bawaslu Subang.
            </p>
            {notificationWarning && (
              <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
                {notificationWarning}
              </p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  setActivePrintTarget(submittedPengajuan);
                  setPrintModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Tanda Terima</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedPengajuan(null);
                  onSuccessRedirect();
                }}
                className="w-full sm:w-auto rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Lihat Riwayat Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT TANDA TERIMA MODAL */}
      {activePrintTarget && (
        <PrintDocumentModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          pengajuan={activePrintTarget}
          pegawai={pegawai}
          mode="tanda_terima"
          isAdmin={false}
        />
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        document={viewingDoc}
        pengajuan={activeOngoingPengajuan || undefined}
      />
    </div>
  );
};
