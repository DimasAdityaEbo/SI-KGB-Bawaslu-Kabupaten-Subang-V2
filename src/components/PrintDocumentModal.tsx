import React, { useRef, useState } from 'react';
import { X, Download, Building2, Loader2, FileText } from 'lucide-react';
import { PengajuanKGB, Pegawai, KopSuratConfig, TandaTanganCapConfig } from '../types';
import { getKopSuratConfig, getTandaTanganCapConfig, isCurrentUserAdmin } from '../services/storage';
import { exportElementToPdf } from '../services/pdfExport';
import { BawasluLogo } from './BawasluLogo';
import { KopSuratHeader } from './KopSuratHeader';
import { KopSuratModal } from './admin/KopSuratModal';
import { TandaTanganCapBlock } from './TandaTanganCapBlock';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengajuan: PengajuanKGB;
  pegawai?: Pegawai;
  mode: 'surat_pengantar' | 'tanda_terima' | 'disposisi' | 'sk_kgb';
  isAdmin?: boolean;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  pengajuan,
  pegawai,
  mode,
  isAdmin,
}) => {
  const effectiveIsAdmin = isAdmin !== undefined ? isAdmin : isCurrentUserAdmin();
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [ttdCapConfig, setTtdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());
  const [isDownloading, setIsDownloading] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isSuratPengantar = mode === 'surat_pengantar' || mode === 'sk_kgb' || mode === 'disposisi';
  const docTitle = isSuratPengantar
    ? `Surat_Pengantar_KGB_${(pengajuan.namaPemohon || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_')}`
    : `Tanda_Terima_KGB_${(pengajuan.namaPemohon || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_')}`;

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(documentRef.current, {
        filename: `${docTitle}.pdf`,
        orientation: 'portrait',
        format: 'a4',
      });
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Gagal mengunduh dokumen PDF. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0,-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              {isSuratPengantar
                ? 'Pratinjau & Unduh Surat Pengantar Usulan KGB (PDF)'
                : 'Pratinjau & Unduh Bukti Tanda Terima Berkas (PDF)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {effectiveIsAdmin && (
              <button
                onClick={() => setIsKopModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Atur Kop</span>
              </button>
            )}
            {/* Action: Download Dokumen PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 px-4 py-1.5 text-xs font-bold text-white shadow transition"
              title="Unduh dokumen resmi dalam format PDF langsung ke komputer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengunduh PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/70">
          <div
            ref={documentRef}
            className="mx-auto max-w-[210mm] bg-white p-8 sm:p-12 shadow border border-slate-200 text-slate-900 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none"
          >
            {/* KOP SURAT RESMI DINAMIS */}
            <KopSuratHeader config={kopConfig} />

            {/* DOKUMEN 1: SURAT PENGANTAR USULAN KGB */}
            {isSuratPengantar && (
              <div>
                {/* Header Metadata Surat Dinas Bawaslu */}
                <div className="flex justify-between items-start text-xs mb-6 font-sans">
                  <table className="text-xs">
                    <tbody>
                      <tr>
                        <td className="w-20 py-0.5 text-slate-700 font-medium">Nomor</td>
                        <td className="py-0.5 font-mono">: {pengajuan.nomorSkKgbDiterbitkan || '045.2/KP.04.00/JB-22/10/2026'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-slate-700 font-medium">Sifat</td>
                        <td className="py-0.5">: Biasa / Dinas</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-slate-700 font-medium">Lampiran</td>
                        <td className="py-0.5">: 1 (satu) Berkas</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-slate-700 font-medium align-top">Perihal</td>
                        <td className="py-0.5 font-semibold text-slate-900 align-top">
                          : Usulan Kenaikan Gaji Berkala (KGB)<br />
                            an. {pengajuan.namaPemohon}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-right text-xs">
                    <p className="text-slate-700">
                      Subang, {pengajuan.tanggalSkDiterbitkan || new Date(pengajuan.tanggalPengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="mt-4 text-left inline-block">
                      <p className="font-semibold text-slate-900">Kepada Yth.</p>
                      <p className="font-bold text-slate-900">Kepala Sekretariat Bawaslu Provinsi Jawa Barat</p>
                      <p className="text-slate-700">Up. Bagian Administrasi / Kepegawaian</p>
                      <p className="text-slate-700">di -</p>
                      <p className="font-semibold text-slate-800 pl-4 tracking-wider">B A N D U N G</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-justify">
                  <p>
                    Dengan hormat, bersama ini kami sampaikan berkas usulan Kenaikan Gaji Berkala (KGB) Pegawai di lingkungan Sekretariat Badan Pengawas Pemilihan Umum Kabupaten Subang atas nama Pegawai berikut:
                  </p>

                  <table className="w-full border-collapse my-2">
                    <tbody>
                      <tr>
                        <td className="w-48 py-1.5 text-slate-700 font-medium">1. Nama Pegawai</td>
                        <td className="py-1.5 font-bold text-slate-950">: {pengajuan.namaPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">2. NIP / NIK</td>
                        <td className="py-1.5 font-mono text-slate-950">: {pengajuan.nipPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">3. Pangkat / Golongan</td>
                        <td className="py-1.5 text-slate-950">: {pegawai?.golonganPangkat || 'Penata Muda / III/a'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">4. Jabatan</td>
                        <td className="py-1.5 text-slate-950">: {pengajuan.jabatanPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">5. Unit Kerja / Divisi</td>
                        <td className="py-1.5 text-slate-950">: {pengajuan.divisiPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">6. Gaji Pokok Lama</td>
                        <td className="py-1.5 font-mono text-slate-950">: {formatRupiah(pengajuan.gajiLama)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">7. Usulan Gaji Pokok Baru</td>
                        <td className="py-1.5 font-bold font-mono text-emerald-800">: {formatRupiah(pengajuan.gajiBaruEstimasi)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">8. Terhitung Mulai Tanggal (TMT)</td>
                        <td className="py-1.5 font-bold text-slate-950">: {pengajuan.tmtKgbBaru}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p>
                    Sebagai bahan pertimbangan dan kelengkapan administrasi pemrosesan lebih lanjut di tingkat Bawaslu Provinsi Jawa Barat, bersama ini kami lampirkan:
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 text-slate-800">
                    <li>Salinan Surat Keputusan (SK) Kenaikan Pangkat Terakhir;</li>
                    <li>Salinan Surat Keputusan Kenaikan Gaji Berkala (KGB) Terakhir;</li>
                    <li>Salinan Sasaran Kinerja Pegawai (SKP) dengan predikat capaian kinerja minimal Baik;</li>
                    <li>Lembar Tanda Terima Pengajuan Berkas Digital ({pengajuan.noPengajuan}).</li>
                  </ol>

                  <p className="pt-2">
                    Demikian surat pengantar usulan kenaikan gaji berkala ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan perkenan Bapak/Ibu, kami ucapkan terima kasih.
                  </p>

                  {/* Signatures */}
                  <div className="pt-8 flex justify-end">
                    <TandaTanganCapBlock
                      config={ttdCapConfig}
                      mode="pimpinan_saja"
                      tanggalText={`Subang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      align="right"
                    />
                  </div>

                  {/* Tembusan */}
                  <div className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                    <span className="font-semibold block mb-1">Tembusan disampaikan Kepada Yth:</span>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Ketua Bawaslu Kabupaten Subang (sebagai laporan);</li>
                      <li>Kepala Bagian Administrasi Bawaslu Provinsi Jawa Barat;</li>
                      <li>Pegawai yang bersangkutan;</li>
                      <li>Arsip Sub Bagian Kepegawaian &amp; SDM.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* DOKUMEN 2: BUKTI TANDA TERIMA BERKAS ELEKTRONIK */}
            {!isSuratPengantar && (
              <div>
                <div className="text-center mb-6">
                  <h4 className="font-bold underline text-sm uppercase tracking-wide">
                    BUKTI TANDA TERIMA PENGAJUAN KGB ELEKTRONIK
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    SI-KGB BADAN PENGAWAS PEMILIHAN UMUM KABUPATEN SUBANG
                  </p>
                </div>

                <div className="border border-slate-300 p-5 rounded-lg text-xs space-y-3 mb-6 bg-slate-50/50">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Nomor Registrasi:</span>
                    <span className="font-bold font-mono text-indigo-900">{pengajuan.noPengajuan}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Nama Pemohon:</span>
                    <span className="font-bold text-slate-900">{pengajuan.namaPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">NIP / NIK:</span>
                    <span className="font-mono text-slate-800">{pengajuan.nipPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Pangkat / Golongan:</span>
                    <span className="text-slate-800">{pegawai?.golonganPangkat || 'Penata Muda / III/a'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Jabatan / Divisi:</span>
                    <span className="text-slate-800">{pengajuan.jabatanPemohon} - {pengajuan.divisiPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Perihal Permohonan:</span>
                    <span className="text-slate-800 font-medium">{pengajuan.perihal}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Waktu Pengajuan:</span>
                    <span className="font-mono text-slate-800">{new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Kelengkapan Berkas:</span>
                    <span className="text-slate-800">
                      SK Pangkat Terakhir ({pengajuan.skPangkatTerakhir.namaFile}), SKP Prestasi ({pengajuan.dokumenSkpPrestasi.namaFile})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Estimasi Waktu Proses:</span>
                    <span className="font-semibold text-emerald-800">7 (tujuh) Hari Kerja</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed text-center mb-6">
                  Simpan tanda terima digital ini sebagai referensi resmi pemantauan proses kenaikan gaji berkala Anda. Anda juga akan menerima pembaruan status berkala melalui pos-el ke <strong>{pengajuan.emailPemohon}</strong>.
                </p>

                {/* Signatures */}
                <div className="pt-4 flex justify-end">
                  <TandaTanganCapBlock
                    config={ttdCapConfig}
                    mode="pimpinan_saja"
                    customJabatan="Petugas Pelayanan Terpadu Satu Pintu"
                    customNamaPejabat="SUB BAGIAN ADMINISTRASI BAWASLU SUBANG"
                    customNip="198906152015031002"
                    tanggalText={`Subang, ${new Date(pengajuan.tanggalPengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    align="right"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KOP SURAT MODAL */}
      <KopSuratModal
        isOpen={isKopModalOpen && effectiveIsAdmin}
        onClose={() => setIsKopModalOpen(false)}
        onSaved={(newCfg) => setKopConfig(newCfg)}
        isAdmin={effectiveIsAdmin}
      />

    </div>
  );
};
