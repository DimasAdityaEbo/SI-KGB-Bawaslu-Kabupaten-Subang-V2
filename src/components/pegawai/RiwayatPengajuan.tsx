import React, { useState } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Printer,
  Download,
  Upload,
  X,
  FileCheck,
  Send,
  FilePlus2,
  Trash2,
} from 'lucide-react';
import { Pegawai, PengajuanKGB, PengajuanStatus, DokumenLampiran } from '../../types';
import { savePengajuan, deletePengajuan } from '../../services/storage';
import { sendKgbStatusEmail } from '../../services/emailService';
import { PrintDocumentModal } from '../PrintDocumentModal';
import { DocumentViewerModal } from '../DocumentViewerModal';
import { downloadDokumenFile, readFileAsDataUrl } from '../../services/documentUtils';

interface RiwayatPengajuanProps {
  pegawai: Pegawai;
  pengajuanList: PengajuanKGB[];
  onRefreshData: () => void;
  selectedPengajuanFromDashboard?: PengajuanKGB | null;
  onClearSelectedPengajuan?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const RiwayatPengajuan: React.FC<RiwayatPengajuanProps> = ({
  pegawai,
  pengajuanList,
  onRefreshData,
  selectedPengajuanFromDashboard,
  onClearSelectedPengajuan,
  onSelectTab,
}) => {
  const mySubmissions = [...pengajuanList.filter((p) => p.pegawaiId === pegawai.id)].sort(
    (a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime()
  );

  const ongoingSubmission = mySubmissions.find(
    (p) => p.status !== 'disetujui' && p.status !== 'ditolak'
  );
  const canSubmitNew = !ongoingSubmission;

  const [activePengajuan, setActivePengajuan] = useState<PengajuanKGB | null>(
    selectedPengajuanFromDashboard || null
  );

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<DokumenLampiran | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'surat_pengantar' | 'tanda_terima'>('tanda_terima');

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

  // Revision state
  const [isRevising, setIsRevising] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const handleOpenDetail = (item: PengajuanKGB) => {
    setActivePengajuan(item);
    setIsRevising(false);
    setRevisionFile(null);
  };

  const handleCloseDetail = () => {
    setActivePengajuan(null);
    if (onClearSelectedPengajuan) onClearSelectedPengajuan();
  };

  const handleOpenPrint = (mode: 'surat_pengantar' | 'tanda_terima') => {
    setPrintMode(mode);
    setPrintModalOpen(true);
  };

  const handleSubmitRevision = async () => {
    if (!activePengajuan || !revisionFile) {
      alert('Harap pilih berkas revisi yang diminta verifikator.');
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const revisionFileData = await readFileAsDataUrl(revisionFile);

      const updated: PengajuanKGB = {
        ...activePengajuan,
        status: 'menunggu_verifikasi',
        dokumenSkpPrestasi: {
          id: `rev-${Date.now()}`,
          namaFile: revisionFile.name,
          jenisDokumen: 'skp_prestasi',
          tipeFile: revisionFile.type || 'application/pdf',
          ukuranFile: `${(revisionFile.size / (1024 * 1024)).toFixed(2)} MB`,
          fileData: revisionFileData,
          uploadedAt: new Date().toISOString(),
        },
        catatanPemohon: revisionNote
          ? `[Perbaikan Berkas] ${revisionNote}`
          : activePengajuan.catatanPemohon,
        tanggalPengajuan: new Date().toISOString(),
      };

      await savePengajuan(updated);
      await sendKgbStatusEmail(updated, 'dibuat');

      setActivePengajuan(updated);
      setIsRevising(false);
      onRefreshData();
      alert('Berkas perbaikan berhasil dikirimkan kembali untuk diverifikasi!');
    } catch (e) {
      console.error(e);
      alert('Gagal mengirimkan berkas revisi.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

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
            <Send className="h-3 w-3 text-indigo-600" /> Sudah Dikirim ke Bawaslu Provinsi
          </span>
        );
      case 'perlu_perbaikan':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3" /> Perlu Perbaikan Berkas
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Disetujui (SK Terbit)
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
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Riwayat Pengajuan Kenaikan Gaji Berkala (KGB)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh berkas permohonan yang pernah Anda ajukan ke Sekretariat Bawaslu Kabupaten Subang.
            </p>
          </div>
          {onSelectTab && (
            <div>
              {canSubmitNew ? (
                <button
                  onClick={() => onSelectTab('ajukan')}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
                >
                  <FilePlus2 className="h-4 w-4" />
                  <span>Ajukan KGB Baru</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>
                    Pengajuan Aktif:{' '}
                    <strong className="font-mono">{ongoingSubmission?.noPengajuan}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Submissions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">No. Registrasi</th>
                <th className="py-3 px-4 font-semibold">Perihal &amp; Periode</th>
                <th className="py-3 px-4 font-semibold">Tanggal Diajukan</th>
                <th className="py-3 px-4 font-semibold">Status Saat Ini</th>
                <th className="py-3 px-4 font-semibold">Nomor SK KGB</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mySubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="mb-2">Belum ada riwayat permohonan kenaikan gaji berkala.</p>
                    {onSelectTab && (
                      <button
                        onClick={() => onSelectTab('ajukan')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                        <span>Mulai Pengajuan KGB</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                mySubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.noPengajuan}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.perihal}</p>
                      <p className="text-[11px] text-slate-500">TMT: {item.tmtKgbBaru}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {item.nomorSkKgbDiterbitkan || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail &amp; Dokumen</span>
                        </button>
                        {item.status !== 'disetujui' && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 hover:border-red-300 transition"
                            title={`Hapus Berkas Pengajuan ${item.noPengajuan}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL WITH TRACKING & REVISION OPTION */}
      {activePengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detail Status Pengajuan: {activePengajuan.noPengajuan}
                </h3>
                <p className="text-xs text-slate-500">{activePengajuan.perihal}</p>
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
              {/* Stepper Progress */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="font-bold text-slate-900 mb-3 text-center">Tahapan Verifikasi Berkas</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">1. Diajukan</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(activePengajuan.tanggalPengajuan).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${
                        activePengajuan.status === 'disetujui' || activePengajuan.status === 'dikirim_ke_provinsi'
                          ? 'bg-emerald-600 text-white'
                          : activePengajuan.status === 'perlu_perbaikan'
                          ? 'bg-orange-500 text-white'
                          : activePengajuan.status === 'ditolak'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {activePengajuan.status === 'disetujui' || activePengajuan.status === 'dikirim_ke_provinsi' ? '✓' : '2'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">2. Verifikasi Berkas</span>
                    <span className="text-[10px] text-slate-500">Staf Bawaslu Subang</span>
                  </div>

                  {/* Step 3: Sudah Dikirim ke Bawaslu Provinsi */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${
                        activePengajuan.status === 'disetujui'
                          ? 'bg-emerald-600 text-white'
                          : activePengajuan.status === 'dikirim_ke_provinsi'
                          ? 'bg-indigo-600 text-white animate-pulse ring-2 ring-indigo-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {activePengajuan.status === 'disetujui' ? '✓' : '3'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">3. Dikirim ke Provinsi</span>
                    <span className="text-[10px] text-slate-500">
                      {activePengajuan.status === 'dikirim_ke_provinsi'
                        ? 'Sudah Dikirim ke Provinsi'
                        : activePengajuan.status === 'disetujui'
                        ? 'Selesai di Provinsi'
                        : 'Bawaslu Jawa Barat'}
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${
                        activePengajuan.status === 'disetujui'
                          ? 'bg-emerald-600 text-white'
                          : activePengajuan.status === 'ditolak'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {activePengajuan.status === 'disetujui' ? '✓' : '4'}
                    </div>
                    <span className="font-semibold text-slate-900 mt-1">4. Hasil Penetapan</span>
                    <span className="text-[10px] text-slate-500">
                      {activePengajuan.status === 'disetujui'
                        ? 'SK KGB Terbit'
                        : activePengajuan.status === 'ditolak'
                        ? 'Ditolak'
                        : 'Penerbitan SK'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner info khusus bila berkas sudah dikirim ke provinsi */}
              {activePengajuan.status === 'dikirim_ke_provinsi' && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Send className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Status: Berkas Sudah Dikirim ke Bawaslu Provinsi Jawa Barat</p>
                    <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                      Seluruh berkas persyaratan telah selesai diverifikasi oleh Sub Bagian Administrasi &amp; Kepegawaian Bawaslu Kabupaten Subang dan <strong>sudah resmi dikirimkan ke Bawaslu Provinsi Jawa Barat</strong> untuk proses penerbitan surat rekomendasi / penetapan kenaikan gaji berkala.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-white">
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Permohonan:</span>
                  <div className="mt-1">{getStatusBadge(activePengajuan.status)}</div>
                </div>
                {activePengajuan.nomorSkKgbDiterbitkan && (
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Nomor SK KGB:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activePengajuan.nomorSkKgbDiterbitkan}
                    </span>
                  </div>
                )}
              </div>

              {/* Verifier Note if any */}
              {activePengajuan.catatanVerifikator && (
                <div
                  className={`rounded-lg p-3.5 border ${
                    activePengajuan.status === 'perlu_perbaikan'
                      ? 'border-orange-300 bg-orange-50 text-orange-950'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Catatan dari Petugas Verifikator:
                  </p>
                  <p className="mt-1 italic leading-relaxed">
                    "{activePengajuan.catatanVerifikator}"
                  </p>
                </div>
              )}

              {/* RE-UPLOAD SECTION IF STATUS IS PERLU_PERBAIKAN */}
              {activePengajuan.status === 'perlu_perbaikan' && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-orange-700" />
                      <span>Kirim Dokumen Perbaikan / Revisi</span>
                    </h4>
                    {!isRevising && (
                      <button
                        onClick={() => setIsRevising(true)}
                        className="rounded bg-orange-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-orange-700"
                      >
                        Unggah Revisi
                      </button>
                    )}
                  </div>

                  {isRevising && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Pilih Berkas SKP / Dokumen Revisi yang Benar:
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setRevisionFile(e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Catatan Tambahan untuk Verifikator:
                        </label>
                        <input
                          type="text"
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                          placeholder="Contoh: Terlampir lembar SKP 2025 yang sudah ditandatangani basah..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRevising(false)}
                          className="rounded-lg border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingRevision || !revisionFile}
                          onClick={handleSubmitRevision}
                          className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-1 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          <span>{isSubmittingRevision ? 'Mengirim...' : 'Kirim Perbaikan'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Berkas Dokumen yang Anda Lampirkan:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* SK Pangkat */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">SK Pangkat Terakhir</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={activePengajuan.skPangkatTerakhir.namaFile}>
                        {activePengajuan.skPangkatTerakhir.namaFile}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activePengajuan.skPangkatTerakhir.ukuranFile}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDoc(activePengajuan.skPangkatTerakhir);
                          setIsDocViewerOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDokumenFile(activePengajuan.skPangkatTerakhir, activePengajuan)}
                        className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        title="Unduh Berkas"
                      >
                        <Download className="h-3 w-3" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  {/* SKP / Prestasi Kerja */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">SKP / Prestasi Kerja</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={activePengajuan.dokumenSkpPrestasi.namaFile}>
                        {activePengajuan.dokumenSkpPrestasi.namaFile}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activePengajuan.dokumenSkpPrestasi.ukuranFile}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDoc(activePengajuan.dokumenSkpPrestasi);
                          setIsDocViewerOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDokumenFile(activePengajuan.dokumenSkpPrestasi, activePengajuan)}
                        className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        title="Unduh Berkas"
                      >
                        <Download className="h-3 w-3" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  {/* SK KGB Terakhir jika ada */}
                  {activePengajuan.skGajiBerkalaTerakhir && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-between sm:col-span-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">SK KGB Periode Sebelumnya</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5" title={activePengajuan.skGajiBerkalaTerakhir.namaFile}>
                          {activePengajuan.skGajiBerkalaTerakhir.namaFile}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {activePengajuan.skGajiBerkalaTerakhir.ukuranFile}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (activePengajuan.skGajiBerkalaTerakhir) {
                              setViewingDoc(activePengajuan.skGajiBerkalaTerakhir);
                              setIsDocViewerOpen(true);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
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
                          className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          title="Unduh Berkas"
                        >
                          <Download className="h-3 w-3" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cetak Tanda Terima / Surat Pengantar Actions & Delete */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                {activePengajuan.status !== 'disetujui' ? (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(activePengajuan)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition shadow-2xs"
                    title="Hapus berkas permohonan pengajuan KGB ini"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    <span>Hapus Pengajuan</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 mr-1">Cetak Dokumen:</span>
                  <button
                    onClick={() => handleOpenPrint('tanda_terima')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Printer className="h-3.5 w-3.5 text-sky-600" />
                    <span>Tanda Terima Digital</span>
                  </button>
                  {activePengajuan.status === 'disetujui' && (
                    <button
                      onClick={() => handleOpenPrint('surat_pengantar')}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-xs"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Surat Pengantar KGB</span>
                    </button>
                  )}
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
          pegawai={pegawai}
          mode={printMode}
          isAdmin={false}
        />
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        document={viewingDoc}
        pengajuan={activePengajuan || undefined}
      />

      {/* ================= MODAL KONFIRMASI HAPUS PENGAJUAN PEGAWAI ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Batalkan &amp; Hapus Pengajuan KGB?
                </h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Anda akan menghapus berkas pengajuan KGB <strong>{deleteTarget.noPengajuan}</strong>. Tindakan ini permanen. Setelah dihapus, Anda dapat mengajukan berkas baru dari awal.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Perihal:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.perihal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal Diajukan:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(deleteTarget.tanggalPengajuan).toLocaleDateString('id-ID')}
                </span>
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
