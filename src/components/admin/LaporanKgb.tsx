import React, { useState, useRef } from 'react';
import {
  BarChart3,
  Download,
  Loader2,
  Calendar,
  Filter,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { PengajuanKGB, Pegawai, KopSuratConfig, TandaTanganCapConfig } from '../../types';
import { DIVISI_OPTIONS } from '../../data/seedData';
import { getKopSuratConfig, getTandaTanganCapConfig } from '../../services/storage';
import { exportElementToPdf } from '../../services/pdfExport';
import { BawasluLogo } from '../BawasluLogo';
import { KopSuratHeader } from '../KopSuratHeader';
import { KopSuratModal } from './KopSuratModal';
import { TandaTanganCapBlock } from '../TandaTanganCapBlock';

interface LaporanKgbProps {
  pengajuanList: PengajuanKGB[];
  pegawaiList: Pegawai[];
}

export const LaporanKgb: React.FC<LaporanKgbProps> = ({ pengajuanList, pegawaiList }) => {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [filterDivisi, setFilterDivisi] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isDownloading, setIsDownloading] = useState(false);
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [ttdCapConfig, setTtdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());
  const reportRef = useRef<HTMLDivElement>(null);

  // Filtered dataset
  const filteredData = pengajuanList.filter((item) => {
    const itemDate = item.tanggalPengajuan.split('T')[0];
    const matchDate = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    const matchDivisi = filterDivisi === 'ALL' || item.divisiPemohon === filterDivisi;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchDate && matchDivisi && matchStatus;
  });

  const countTotal = filteredData.length;
  const countApproved = filteredData.filter((i) => i.status === 'disetujui').length;
  const countPending = filteredData.filter((i) => i.status === 'menunggu_verifikasi').length;
  const countRevision = filteredData.filter((i) => i.status === 'perlu_perbaikan').length;

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(reportRef.current, {
        filename: `Laporan_Rekap_KGB_Bawaslu_${startDate}_sd_${endDate}.pdf`,
        orientation: 'landscape',
        format: 'a4',
      });
    } catch (err) {
      console.error('Download laporan PDF error:', err);
      alert('Gagal mengunduh laporan PDF. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Laporan Kenaikan Gaji Berkala (KGB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi berkas pengajuan KGB per divisi, pemantauan status, dan unduh laporan resmi format PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsKopModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
          >
            <Building2 className="h-4 w-4 text-amber-600" />
            <span>Atur Kop Surat</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 px-4 py-2 text-xs font-bold text-white shadow transition"
            title="Unduh laporan resmi format PDF"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengunduh PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Laporan (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Bagian / Divisi
          </label>
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Bagian / Divisi</option>
            {DIVISI_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Status Pengajuan
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="disetujui">Disetujui (SK Terbit)</option>
            <option value="dikirim_ke_provinsi">Dikirim ke Bawaslu Provinsi</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-[11px] text-slate-500 font-semibold">Total Berkas Masuk</p>
          <p className="font-mono-numbers text-xl font-bold text-slate-900 mt-1">{countTotal}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <p className="text-[11px] text-emerald-800 font-semibold">Telah Disetujui</p>
          <p className="font-mono-numbers text-xl font-bold text-emerald-950 mt-1">{countApproved}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-[11px] text-amber-800 font-semibold">Menunggu Verifikasi</p>
          <p className="font-mono-numbers text-xl font-bold text-amber-950 mt-1">{countPending}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 text-center">
          <p className="text-[11px] text-orange-800 font-semibold">Perbaikan Dokumen</p>
          <p className="font-mono-numbers text-xl font-bold text-orange-950 mt-1">{countRevision}</p>
        </div>
      </div>

      {/* REPORT CONTENT & PRINTABLE CONTAINER */}
      <div
        ref={reportRef}
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs print:border-none print:shadow-none print:p-0"
      >
        {/* Printable Letterhead Dinamis */}
        <KopSuratHeader config={kopConfig} isCompact={true} />

        {/* Report Title */}
        <div className="text-center mb-6">
          <h4 className="font-bold text-sm uppercase text-slate-900 tracking-wide">
            REKAPITULASI PELAYANAN PENGAJUAN KENAIKAN GAJI BERKALA (KGB)
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Periode: {startDate} s/d {endDate} {filterDivisi !== 'ALL' ? `· Bagian: ${filterDivisi}` : ''}
          </p>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase">
                <th className="py-2.5 px-3 border border-slate-200 text-center w-10">No</th>
                <th className="py-2.5 px-3 border border-slate-200">No. Registrasi</th>
                <th className="py-2.5 px-3 border border-slate-200">Nama Pegawai &amp; NIP</th>
                <th className="py-2.5 px-3 border border-slate-200">Divisi / Unit Kerja</th>
                <th className="py-2.5 px-3 border border-slate-200">TMT KGB</th>
                <th className="py-2.5 px-3 border border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3 border border-slate-200">No. SK / Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan pengajuan pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((d, index) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 print-break-inside-avoid">
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono font-semibold text-slate-900">
                      {d.noPengajuan}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200">
                      <p className="font-bold text-slate-900">{d.namaPemohon}</p>
                      <p className="font-mono text-[10px] text-slate-500">NIP. {d.nipPemohon}</p>
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-slate-700">
                      {d.divisiPemohon}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono">
                      {d.tmtKgbBaru}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center">
                      <span className="font-semibold uppercase text-[10px]">
                        {d.status === 'dikirim_ke_provinsi'
                          ? 'DIKIRIM KE PROVINSI'
                          : d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono text-[11px]">
                      {d.nomorSkKgbDiterbitkan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Block (Printable) */}
        <div className="mt-12 flex justify-end print-break-inside-avoid">
          <TandaTanganCapBlock config={ttdCapConfig} align="right" mode="pimpinan_saja" />
        </div>
      </div>

      {/* KOP SURAT CONFIGURATION MODAL */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        onSaved={(newCfg) => setKopConfig(newCfg)}
        isAdmin={true}
      />

    </div>
  );
};
