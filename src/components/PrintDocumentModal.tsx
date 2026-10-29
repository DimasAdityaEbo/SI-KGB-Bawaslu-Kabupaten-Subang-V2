import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Building2,
  Loader2,
  FileText,
  Printer,
  ChevronDown,
  RotateCcw,
  Check,
  Sliders,
} from 'lucide-react';
import {
  PengajuanKGB,
  Pegawai,
  KopSuratConfig,
  TandaTanganCapConfig,
  TemplateDokumen,
  TemplateKategori,
} from '../types';
import {
  getKopSuratConfig,
  getTandaTanganCapConfig,
  isCurrentUserAdmin,
  getTemplatesList,
} from '../services/storage';
import { exportElementToPdf } from '../services/pdfExport';
import { KopSuratHeader } from './KopSuratHeader';
import { KopSuratModal } from './admin/KopSuratModal';
import { TandaTanganCapBlock } from './TandaTanganCapBlock';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengajuan: PengajuanKGB;
  pegawai?: Pegawai;
  mode?: 'surat_pengantar' | 'tanda_terima' | 'disposisi' | 'sk_kgb';
  isAdmin?: boolean;
}

function renderTemplateContent(
  content: string,
  isSuratPengantar: boolean,
  viewStyle: 'formatted' | 'raw'
) {
  if (viewStyle === 'raw') {
    return (
      <div className="whitespace-pre-line text-justify leading-relaxed font-sans text-xs text-slate-900">
        {content}
      </div>
    );
  }

  const rawLines = content.split(/\r?\n/);
  const lines = [...rawLines];

  // If Surat Pengantar, check if first line is a place/date like "Subang, ..."
  let dateHeader: string | null = null;
  if (isSuratPengantar && lines[0] && /^[A-Z][a-z]+,\s*\d/i.test(lines[0].trim())) {
    dateHeader = lines.shift()!.trim();
  }

  // Group consecutive lines into blocks
  const blocks: Array<{
    type: 'kv' | 'checklist' | 'list' | 'p' | 'empty';
    items: string[];
  }> = [];

  let currentBlock: { type: 'kv' | 'checklist' | 'list' | 'p' | 'empty'; items: string[] } | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'empty', items: [''] });
      continue;
    }

    const isCheck = /^\[[✓✔xX\s]\]/.test(trimmed);
    const isNumbered = /^\d+[\.\)]\s/.test(trimmed);
    const isKv = trimmed.includes(' : ') && !trimmed.startsWith('http');

    let lineType: 'kv' | 'checklist' | 'list' | 'p' = 'p';
    if (isCheck) lineType = 'checklist';
    else if (isKv) lineType = 'kv';
    else if (isNumbered) lineType = 'list';

    if (currentBlock && currentBlock.type === lineType) {
      currentBlock.items.push(trimmed);
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: lineType, items: [trimmed] };
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  return (
    <div className="space-y-3.5 text-xs text-slate-900 font-sans leading-relaxed">
      {dateHeader && (
        <div className="text-right text-xs font-semibold text-slate-800 mb-2">
          {dateHeader}
        </div>
      )}

      {blocks.map((block, idx) => {
        if (block.type === 'empty') {
          return <div key={idx} className="h-1.5" />;
        }

        if (block.type === 'kv') {
          const isLetterHeader = block.items.some(
            (it) => it.startsWith('Nomor :') || it.startsWith('Sifat :') || it.startsWith('Hal :')
          );

          if (isLetterHeader) {
            return (
              <div key={idx} className="my-2">
                <table className="text-xs border-collapse">
                  <tbody>
                    {block.items.map((item, itemIdx) => {
                      const colonIdx = item.indexOf(' : ');
                      const label = item.slice(0, colonIdx).trim();
                      const value = item.slice(colonIdx + 3).trim();
                      return (
                        <tr key={itemIdx}>
                          <td className="w-24 py-0.5 text-slate-700 font-medium align-top">
                            {label}
                          </td>
                          <td className="w-3 py-0.5 text-slate-500 align-top">:</td>
                          <td className="py-0.5 font-semibold text-slate-900 align-top">
                            {value}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 shadow-2xs"
            >
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {block.items.map((item, itemIdx) => {
                    const colonIdx = item.indexOf(' : ');
                    const label = item.slice(0, colonIdx).trim();
                    const value = item.slice(colonIdx + 3).trim();
                    const isHighlight =
                      label.toLowerCase().includes('baru') ||
                      label.toLowerCase().includes('usulan gaji') ||
                      label.toLowerCase().includes('registrasi');
                    return (
                      <tr
                        key={itemIdx}
                        className={`border-b border-slate-200/70 last:border-none ${
                          isHighlight ? 'bg-indigo-50/50 font-semibold' : ''
                        }`}
                      >
                        <td className="w-48 sm:w-56 py-1.5 px-2 text-slate-700 font-medium align-top">
                          {label}
                        </td>
                        <td className="w-3 py-1.5 text-slate-400 align-top">:</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-950 align-top">
                          {value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'checklist') {
          return (
            <div
              key={idx}
              className="my-2.5 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
            >
              {block.items.map((item, itemIdx) => {
                const text = item.replace(/^\[[✓✔xX\s]\]\s*/, '');
                return (
                  <div key={itemIdx} className="flex items-start gap-2 text-xs">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-emerald-100 text-[10px] font-bold text-emerald-700 mt-0.5">
                      ✓
                    </span>
                    <span className="text-slate-800 font-medium leading-tight">{text}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ol key={idx} className="my-2 list-decimal pl-6 space-y-1 text-xs text-slate-800">
              {block.items.map((item, itemIdx) => {
                const text = item.replace(/^\d+[\.\)]\s*/, '');
                return (
                  <li key={itemIdx} className="leading-relaxed">
                    {text}
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={idx} className="text-justify leading-relaxed whitespace-pre-line text-slate-900">
            {block.items.join('\n')}
          </p>
        );
      })}
    </div>
  );
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  pengajuan,
  pegawai,
  mode = 'surat_pengantar',
  isAdmin,
}) => {
  const effectiveIsAdmin = isAdmin !== undefined ? isAdmin : isCurrentUserAdmin();
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [ttdCapConfig, setTtdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewStyle, setViewStyle] = useState<'formatted' | 'raw'>('formatted');

  // Template state
  const [templates, setTemplates] = useState<TemplateDokumen[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const documentRef = useRef<HTMLDivElement>(null);

  // Load templates on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      const list = await getTemplatesList();
      setTemplates(list);

      // Determine initial template matching the requested mode
      let matched = list.find((t) => t.kategori === mode);
      if (!matched) {
        if (mode === 'surat_pengantar') {
          matched = list.find((t) => t.id === 'tmpl-pengantar-provinsi') || list[0];
        } else if (mode === 'tanda_terima') {
          matched = list.find((t) => t.id === 'tmpl-tanda-terima') || list[0];
        } else if (mode === 'sk_kgb') {
          matched = list.find((t) => t.id === 'tmpl-sk-kgb') || list[0];
        } else if (mode === 'disposisi') {
          matched = list.find((t) => t.id === 'tmpl-disposisi') || list[0];
        } else {
          matched = list[0];
        }
      }

      if (matched) {
        setSelectedTemplateId(matched.id);
      } else if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
      }
    };

    loadData();
    setKopConfig(getKopSuratConfig());
    setTtdCapConfig(getTandaTanganCapConfig());
  }, [isOpen, mode]);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0,-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Variable replacement logic adhering strictly to the prepared template
  const resolvedDocument = useMemo(() => {
    if (!isOpen || !activeTemplate || !pengajuan) return null;

    const now = new Date();
    const tglPengajuanDate = new Date(pengajuan.tanggalPengajuan);
    const dateFormatted = (
      pengajuan.tanggalSkDiterbitkan
        ? new Date(pengajuan.tanggalSkDiterbitkan)
        : tglPengajuanDate
    ).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthPadded = String(currentMonth).padStart(2, '0');

    const calculatedNomor = activeTemplate.formatNomor
      .replace(/\{BULAN\}/g, String(currentMonth))
      .replace(/\{BULAN_PADDED\}/g, currentMonthPadded)
      .replace(/\{TAHUN\}/g, String(currentYear));

    const nomorFinal =
      activeTemplate.kategori === 'tanda_terima'
        ? pengajuan.noPengajuan || calculatedNomor
        : pengajuan.nomorSkKgbDiterbitkan || calculatedNomor;

    const tmtDate = pengajuan.tmtKgbBaru
      ? new Date(`${pengajuan.tmtKgbBaru}T00:00:00`)
      : now;
    const tmtFormatted = tmtDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const gajiLamaFormatted = formatRupiah(pengajuan.gajiLama || pegawai?.gajiPokokTerakhir);
    const gajiBaruFormatted = formatRupiah(
      pengajuan.gajiBaruEstimasi ||
        (pegawai?.gajiPokokTerakhir ? pegawai.gajiPokokTerakhir + 160000 : 3980000)
    );

    const namaPegawai = pengajuan.namaPemohon || pegawai?.nama || 'Pegawai';
    const nip = pengajuan.nipPemohon || pegawai?.nip || '-';
    const pangkatGol = pegawai?.golonganPangkat || 'Penata Muda / III/a';
    const jabatan = pengajuan.jabatanPemohon || pegawai?.jabatan || 'Pelaksana';
    const unitKerja =
      pengajuan.divisiPemohon ||
      pegawai?.bagianDivisi ||
      'Sekretariat Bawaslu Kabupaten Subang';

    let content = activeTemplate.isiKonten;
    content = content.replace(/\{NAMA_PEGAWAI\}/g, namaPegawai);
    content = content.replace(/\{NIP\}/g, nip);
    content = content.replace(/\{PANGKAT_GOLONGAN\}/g, pangkatGol);
    content = content.replace(/\{JABATAN\}/g, jabatan);
    content = content.replace(/\{UNIT_KERJA\}/g, unitKerja);
    content = content.replace(/\{TMT_KGB_BARU\}/g, pengajuan.tmtKgbBaru || '');
    content = content.replace(/\{TMT_KGB_FORMAT\}/g, tmtFormatted);
    content = content.replace(/\{GAJI_POKOK_LAMA\}/g, gajiLamaFormatted);
    content = content.replace(/\{GAJI_POKOK_BARU\}/g, gajiBaruFormatted);
    content = content.replace(/\{NOMOR_SURAT\}/g, nomorFinal);
    content = content.replace(/\{TANGGAL_SURAT\}/g, dateFormatted);
    content = content.replace(/\{NAMA_PEJABAT\}/g, activeTemplate.penandatanganNama);
    content = content.replace(/\{JABATAN_PEJABAT\}/g, activeTemplate.penandatanganJabatan);
    content = content.replace(/\{NIP_PEJABAT\}/g, activeTemplate.penandatanganNip);
    content = content.replace(/\{TAHUN\}/g, String(currentYear));
    content = content.replace(/\{BULAN\}/g, String(currentMonth));
    content = content.replace(/\{BULAN_PADDED\}/g, currentMonthPadded);
    content = content.replace(/\{NO_PENGAJUAN\}/g, pengajuan.noPengajuan || nomorFinal);
    content = content.replace(/\{NOMOR_REGISTRASI\}/g, pengajuan.noPengajuan || nomorFinal);
    content = content.replace(/\{PERIHAL\}/g, pengajuan.perihal || 'Permohonan Kenaikan Gaji Berkala (KGB)');
    content = content.replace(/\{PERIODE_KGB\}/g, pengajuan.periodeKgb || '');
    content = content.replace(/\{EMAIL_PEMOHON\}/g, pengajuan.emailPemohon || pegawai?.email || '');
    content = content.replace(/\{EMAIL\}/g, pengajuan.emailPemohon || pegawai?.email || '');
    content = content.replace(/\{NO_HP_PEMOHON\}/g, pengajuan.noHpPemohon || pegawai?.noHp || '');
    content = content.replace(/\{NO_HP\}/g, pengajuan.noHpPemohon || pegawai?.noHp || '');
    content = content.replace(/\{CATATAN_PEMOHON\}/g, pengajuan.catatanPemohon || '-');
    content = content.replace(/\{CATATAN_VERIFIKATOR\}/g, pengajuan.catatanVerifikator || '-');
    content = content.replace(/\{STATUS_PENGAJUAN\}/g, pengajuan.status || '-');

    return {
      nomorSurat: nomorFinal,
      tanggalFormatted: dateFormatted,
      renderedContent: content,
      tmtFormatted,
      gajiLamaFormatted,
      gajiBaruFormatted,
      namaPegawai,
      nip,
      pangkatGol,
      jabatan,
      unitKerja,
    };
  }, [activeTemplate, pengajuan, pegawai]);

  const docFileName = `${(activeTemplate?.judulDokumen || 'Dokumen_KGB').replace(/[^a-zA-Z0-9]/g, '_')}_${(pengajuan?.namaPemohon || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_')}`;

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(documentRef.current, {
        filename: `${docFileName}.pdf`,
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

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[94vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-xs">
        {/* Modal Top Bar */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {activeTemplate?.nama || 'Naskah Dokumen KGB'}
              </span>
              <p className="text-[11px] text-slate-500">
                Format resmi sesuai template dokumen Bawaslu Kabupaten Subang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Template Selector Dropdown */}
            {templates.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Template:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none max-w-[220px] truncate"
                  title="Pilih template naskah dokumen yang telah disiapkan"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Toggle View Style: Formatted vs Raw Text */}
            <button
              onClick={() => setViewStyle((prev) => (prev === 'formatted' ? 'raw' : 'formatted'))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title="Beralih antara tampilan dokumen terformat dan teks asli naskah template"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-600" />
              <span>{viewStyle === 'formatted' ? 'Format Rapi' : 'Teks Asli'}</span>
            </button>

            {effectiveIsAdmin && (
              <button
                onClick={() => setIsKopModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Atur Kop</span>
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title="Cetak dokumen langsung (Printer / PDF)"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 px-4 py-1.5 text-xs font-bold text-white shadow transition"
              title="Unduh dokumen resmi dalam format PDF"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div
            ref={documentRef}
            className="mx-auto max-w-[210mm] bg-white p-8 sm:p-12 shadow border border-slate-200 text-slate-900 text-xs sm:text-sm leading-relaxed print:p-0 print:border-none print:shadow-none print:m-0"
          >
            {/* KOP SURAT RESMI DINAMIS */}
            <KopSuratHeader config={kopConfig} />

            {resolvedDocument && (
              <div className="space-y-5 text-xs text-slate-900 pt-2 font-sans">
                {/* JIKA BUKAN SURAT PENGANTAR (MEMILIKI JUDUL DOKUMEN): TAMPILKAN JUDUL DI TENGAH */}
                {activeTemplate?.kategori !== 'surat_pengantar' && activeTemplate?.judulDokumen && (
                  <div className="text-center mb-5">
                    <h4 className="font-bold underline text-sm sm:text-base uppercase tracking-wide text-slate-950">
                      {activeTemplate.judulDokumen}
                    </h4>
                    {resolvedDocument.nomorSurat && (
                      <p className="text-xs text-slate-700 mt-1 font-mono font-medium">
                        Nomor: {resolvedDocument.nomorSurat}
                      </p>
                    )}
                  </div>
                )}

                {/* KONTEN DOKUMEN SESUAI DENGAN TEMPLATE YANG TELAH DIBUAT/DIATUR */}
                {renderTemplateContent(
                  resolvedDocument.renderedContent,
                  activeTemplate?.kategori === 'surat_pengantar',
                  viewStyle
                )}

                {/* BLOK TANDA TANGAN RESMI */}
                <div className="pt-6 flex justify-end">
                  <TandaTanganCapBlock
                    config={ttdCapConfig}
                    mode="pimpinan_saja"
                    tanggalText={resolvedDocument.tanggalFormatted}
                    customNamaPejabat={activeTemplate?.penandatanganNama}
                    customJabatan={activeTemplate?.penandatanganJabatan}
                    customNip={activeTemplate?.penandatanganNip}
                    align="right"
                    hideCap={true}
                    hideSignature={true}
                  />
                </div>

                {/* BLOK TEMBUSAN */}
                {activeTemplate?.tembusan && activeTemplate.tembusan.length > 0 && (
                  <div className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                    <span className="font-semibold block mb-1">Tembusan disampaikan Kepada Yth:</span>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      {activeTemplate.tembusan.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};
