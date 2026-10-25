import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Download,
  Loader2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Building2,
  Layers,
  FileCode,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import {
  TemplateDokumen,
  TemplateKategori,
  Pegawai,
  PengajuanKGB,
  KopSuratConfig,
  TandaTanganCapConfig,
} from '../../types';
import {
  getTemplatesList,
  saveTemplate,
  deleteTemplate,
  resetTemplatesToDefault,
  getKopSuratConfig,
  getTandaTanganCapConfig,
} from '../../services/storage';
import { exportElementToPdf } from '../../services/pdfExport';
import { KopSuratHeader } from '../KopSuratHeader';
import { KopSuratModal } from './KopSuratModal';
import { TandaTanganCapBlock } from '../TandaTanganCapBlock';

interface TemplateDokumenViewProps {
  pegawaiList: Pegawai[];
  pengajuanList: PengajuanKGB[];
}

const KATEGORI_LABELS: Record<TemplateKategori, { label: string; color: string }> = {
  surat_pengantar: { label: 'Surat Pengantar', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sk_kgb: { label: 'SK / Pemberitahuan KGB', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  disposisi: { label: 'Lembar Disposisi', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  tanda_terima: { label: 'Tanda Terima', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  surat_keterangan: { label: 'Surat Keterangan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  lainnya: { label: 'Lainnya', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const VARIABLE_TAGS = [
  { tag: '{NAMA_PEGAWAI}', label: 'Nama Pegawai' },
  { tag: '{NIP}', label: 'NIP / NIK' },
  { tag: '{PANGKAT_GOLONGAN}', label: 'Pangkat & Golongan' },
  { tag: '{JABATAN}', label: 'Jabatan' },
  { tag: '{UNIT_KERJA}', label: 'Unit Kerja / Divisi' },
  { tag: '{TMT_KGB_BARU}', label: 'TMT KGB Baru' },
  { tag: '{TMT_KGB_FORMAT}', label: 'TMT KGB (Format Tanggal Indonesia)' },
  { tag: '{GAJI_POKOK_LAMA}', label: 'Gaji Pokok Lama' },
  { tag: '{GAJI_POKOK_BARU}', label: 'Gaji Pokok Baru' },
  { tag: '{NOMOR_SURAT}', label: 'Nomor Surat' },
  { tag: '{TANGGAL_SURAT}', label: 'Tanggal Surat (Format Indonesia)' },
  { tag: '{NAMA_PEJABAT}', label: 'Nama Penandatangan' },
  { tag: '{JABATAN_PEJABAT}', label: 'Jabatan Penandatangan' },
  { tag: '{NIP_PEJABAT}', label: 'NIP Penandatangan' },
  { tag: '{TAHUN}', label: 'Tahun Berjalan' },
  { tag: '{BULAN}', label: 'Bulan Berjalan' },
  { tag: '{BULAN_PADDED}', label: 'Bulan (2 Digit)' },
];

export const TemplateDokumenView: React.FC<TemplateDokumenViewProps> = ({
  pegawaiList,
  pengajuanList,
}) => {
  const [templates, setTemplates] = useState<TemplateDokumen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');

  // Modal Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDokumen | null>(null);

  // Form fields
  const [formNama, setFormNama] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formKategori, setFormKategori] = useState<TemplateKategori>('surat_pengantar');
  const [formFormatNomor, setFormFormatNomor] = useState('045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}');
  const [formJudulDokumen, setFormJudulDokumen] = useState('');
  const [formIsiKonten, setFormIsiKonten] = useState('');
  const [formPejabatNama, setFormPejabatNama] = useState('H. TATANG KOSWARA, S.Sos., M.Si');
  const [formPejabatJabatan, setFormPejabatJabatan] = useState('Kepala Sekretariat Bawaslu Kabupaten Subang');
  const [formPejabatNip, setFormPejabatNip] = useState('197405121998031002');
  const [formTembusan, setFormTembusan] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<TemplateDokumen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDokumen | null>(null);
  const [samplePegawaiId, setSamplePegawaiId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const previewSheetRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!previewSheetRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(previewSheetRef.current, {
        filename: `${(previewTemplate?.judulDokumen || 'Template_Dokumen_Bawaslu').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        orientation: 'portrait',
        format: 'a4',
      });
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Gagal mengunduh dokumen PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Kop Surat Settings Modal state
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [ttdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  const loadTemplates = async () => {
    const list = await getTemplatesList();
    setTemplates(list);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Set default sample pegawai for preview
  useEffect(() => {
    if (pegawaiList.length > 0 && !samplePegawaiId) {
      setSamplePegawaiId(pegawaiList[0].id);
    }
  }, [pegawaiList, samplePegawaiId]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormNama('');
    setFormDeskripsi('');
    setFormKategori('surat_pengantar');
    setFormFormatNomor('045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}');
    setFormJudulDokumen('SURAT DINAS RESMI');
    setFormIsiKonten(
      `Dengan ini disampaikan kelengkapan berkas usulan Kenaikan Gaji Berkala (KGB) untuk pegawai:\n\nNama: {NAMA_PEGAWAI}\nNIP: {NIP}\nJabatan: {JABATAN}\nUnit Kerja: {UNIT_KERJA}\n\nDemikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`
    );
    setFormPejabatNama('H. TATANG KOSWARA, S.Sos., M.Si');
    setFormPejabatJabatan('Kepala Sekretariat Bawaslu Kabupaten Subang');
    setFormPejabatNip('197405121998031002');
    setFormTembusan('1. Ketua Bawaslu Kabupaten Subang\n2. Arsip Kepegawaian');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (t: TemplateDokumen) => {
    setEditingTemplate(t);
    setFormNama(t.nama);
    setFormDeskripsi(t.deskripsi);
    setFormKategori(t.kategori);
    setFormFormatNomor(t.formatNomor);
    setFormJudulDokumen(t.judulDokumen);
    setFormIsiKonten(t.isiKonten);
    setFormPejabatNama(t.penandatanganNama);
    setFormPejabatJabatan(t.penandatanganJabatan);
    setFormPejabatNip(t.penandatanganNip);
    setFormTembusan((t.tembusan || []).join('\n'));
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (t: TemplateDokumen) => {
    const duplicated: TemplateDokumen = {
      ...t,
      id: `tmpl-${Date.now()}`,
      nama: `${t.nama} (Salinan)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTemplate(duplicated);
    await loadTemplates();
    showToast(`Template disalin sebagai "${duplicated.nama}"`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      await loadTemplates();
      showToast(`Template "${deleteTarget.nama}" berhasil dihapus.`);

      // If we are also editing this template, close editor
      if (editingTemplate && editingTemplate.id === deleteTarget.id) {
        setIsEditorOpen(false);
        setEditingTemplate(null);
      }

      // If previewing this template, close preview
      if (previewTemplate && previewTemplate.id === deleteTarget.id) {
        setPreviewTemplate(null);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Gagal menghapus template.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Yakin ingin mereset daftar template ke template standar bawaan Bawaslu Subang? Semua template bawaan yang dihapus akan dipulihkan.')) {
      await resetTemplatesToDefault();
      await loadTemplates();
      showToast('Daftar template berhasil dikembalikan ke standar Bawaslu Subang.');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formIsiKonten.trim()) {
      alert('Nama Template dan Isi Konten wajib diisi!');
      return;
    }

    const payload: TemplateDokumen = {
      id: editingTemplate?.id || `tmpl-${Date.now()}`,
      nama: formNama.trim(),
      deskripsi: formDeskripsi.trim() || 'Template dokumen resmi Bawaslu Subang',
      kategori: formKategori,
      formatNomor: formFormatNomor.trim() || '045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}',
      judulDokumen: formJudulDokumen.trim() || 'SURAT PEMBERITAHUAN',
      isiKonten: formIsiKonten.trim(),
      penandatanganNama: formPejabatNama.trim(),
      penandatanganJabatan: formPejabatJabatan.trim(),
      penandatanganNip: formPejabatNip.trim(),
      tembusan: formTembusan
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isDefault: editingTemplate ? editingTemplate.isDefault : false,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTemplate(payload);
    await loadTemplates();
    setIsEditorOpen(false);
    showToast(`Template "${payload.nama}" berhasil disimpan.`);
  };

  const insertVariableTag = (tag: string) => {
    setFormIsiKonten((prev) => prev + (prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ') + tag);
  };

  // Helper to render template variables with real sample data
  const renderDocumentText = (template: TemplateDokumen, selectedPegawai?: Pegawai) => {
    const p = selectedPegawai || (pegawaiList.length > 0 ? pegawaiList[0] : null);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const nomorSurat = template.formatNomor
      .replace('{BULAN}', String(now.getMonth() + 1))
      .replace('{BULAN_PADDED}', String(now.getMonth() + 1).padStart(2, '0'))
      .replace('{TAHUN}', String(now.getFullYear()));

    if (!p) {
      return {
        nomorSurat,
        renderedContent: template.isiKonten,
        tanggalFormatted: dateFormatted,
      };
    }

    const gajiLama = p.gajiPokokTerakhir
      ? p.gajiPokokTerakhir.toLocaleString('id-ID')
      : '3.820.000';
    const gajiBaru = p.gajiPokokTerakhir
      ? (p.gajiPokokTerakhir + 160000).toLocaleString('id-ID')
      : '3.980.000';
    const tmtKgb = p.jadwalKgbBerikutnya || now.toISOString().split('T')[0];
    const tmtKgbFormatted = new Date(`${tmtKgb}T00:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let content = template.isiKonten;
    content = content.replace(/\{NAMA_PEGAWAI\}/g, p.nama);
    content = content.replace(/\{NIP\}/g, p.nip);
    content = content.replace(/\{PANGKAT_GOLONGAN\}/g, p.golonganPangkat || 'Penata Muda / III/a');
    content = content.replace(/\{JABATAN\}/g, p.jabatan || 'Analis Kepegawaian');
    content = content.replace(/\{UNIT_KERJA\}/g, p.bagianDivisi || 'Sekretariat Bawaslu Kabupaten Subang');
    content = content.replace(/\{TMT_KGB_BARU\}/g, tmtKgb);
    content = content.replace(/\{TMT_KGB_FORMAT\}/g, tmtKgbFormatted);
    content = content.replace(/\{GAJI_POKOK_LAMA\}/g, gajiLama);
    content = content.replace(/\{GAJI_POKOK_BARU\}/g, gajiBaru);
    content = content.replace(/\{NOMOR_SURAT\}/g, nomorSurat);
    content = content.replace(/\{TANGGAL_SURAT\}/g, dateFormatted);
    content = content.replace(/\{NAMA_PEJABAT\}/g, template.penandatanganNama);
    content = content.replace(/\{JABATAN_PEJABAT\}/g, template.penandatanganJabatan);
    content = content.replace(/\{NIP_PEJABAT\}/g, template.penandatanganNip);
    content = content.replace(/\{TAHUN\}/g, String(now.getFullYear()));
    content = content.replace(/\{BULAN\}/g, String(now.getMonth() + 1));

    return {
      nomorSurat,
      renderedContent: content,
      tanggalFormatted: dateFormatted,
    };
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.judulDokumen.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = kategoriFilter === 'ALL' || t.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  const activeSamplePegawai = pegawaiList.find((p) => p.id === samplePegawaiId) || pegawaiList[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-3 text-xs">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Kelola Template Dokumen Dinas
                </h1>
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                  {templates.length} Template
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi format naskah dinas resmi output sistem: Surat Pengantar dan Tanda Terima digital.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsKopModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              <span>Atur Kop Surat</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Reset ke template standar bawaan Bawaslu Subang"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            {/* Buat Template Baru Button */}
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Buat Template Baru</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tags Info Box */}
        <div className="mt-4 rounded-lg bg-sky-50/80 border border-sky-200 p-3 text-xs text-sky-950 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-sky-900">Mendukung Tag Variabel Dinamis Otomatis:</span>
            <p className="text-sky-800 mt-0.5">
              Gunakan tanda kurung kurawal seperti <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;NAMA_PEGAWAI&#125;</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;NIP&#125;</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;TMT_KGB_BARU&#125;</code>, dan <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;GAJI_POKOK_BARU&#125;</code> di dalam isi naskah. Sistem akan mengisinya secara otomatis saat dokumen dicetak.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama template, judul dokumen, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-900 focus:outline-none shadow-2xs"
          >
            <option value="ALL">Semua Kategori (Surat Pengantar &amp; Tanda Terima)</option>
            <option value="surat_pengantar">Surat Pengantar</option>
            <option value="tanda_terima">Tanda Terima</option>
          </select>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
            <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada template dokumen yang sesuai dengan pencarian.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Silakan buat template baru, impor berkas Word (.docx), atau tekan Reset Standar.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Pulihkan Template Bawaan</span>
              </button>
            </div>
          </div>
        ) : (
          filteredTemplates.map((item) => {
            const kategoriInfo = KATEGORI_LABELS[item.kategori] || KATEGORI_LABELS.lainnya;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded px-2.5 py-0.5 text-[10px] font-bold border ${kategoriInfo.color}`}
                    >
                      {kategoriInfo.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.isDefault && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Default Bawaslu
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.nama}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.deskripsi}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Format Nomor:</span>
                      <span className="font-mono text-slate-900 font-semibold">{item.formatNomor}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Penandatangan:</span>
                      <span className="text-slate-900 font-semibold truncate max-w-[200px]" title={item.penandatanganNama}>
                        {item.penandatanganNama}
                      </span>
                    </div>
                  </div>

                  {/* Snippet preview */}
                  <div className="mt-3 rounded-lg bg-white border border-slate-200 p-2 text-[10px] text-slate-600 font-mono line-clamp-3 whitespace-pre-line leading-relaxed">
                    {item.isiKonten}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(item)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-sky-600" />
                    <span>Pratinjau &amp; Unduh PDF</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Duplikasi Template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      title="Ubah Template"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {/* HAPUS TEMPLATE - Tersedia untuk SEMUA template (Default maupun Kustom) */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                      title="Hapus Template Dokumen Ini"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL EDITOR TEMPLATE ================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-5 w-5 text-slate-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTemplate ? `Ubah Template Dokumen: ${editingTemplate.nama}` : 'Buat Template Dokumen Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan judul, isi naskah, format penomoran, dan data penandatangan resmi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Template */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nama Template Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Surat Pengantar Usulan KGB ke Bawaslu Provinsi Jawa Barat"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Kategori Dokumen *
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as TemplateKategori)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="surat_pengantar">Surat Pengantar (ke Bawaslu Provinsi / Instansi)</option>
                    <option value="tanda_terima">Bukti Tanda Terima Pengajuan Berkas</option>
                  </select>
                </div>

                {/* Format Nomor Surat */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Format Nomor Surat *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFormatNomor}
                    onChange={(e) => setFormFormatNomor(e.target.value)}
                    placeholder="045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Judul Dokumen Naskah */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Judul Naskah (Huruf Kapital pada Lembar Surat) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudulDokumen}
                    onChange={(e) => setFormJudulDokumen(e.target.value)}
                    placeholder="SURAT PENGANTAR USULAN KENAIKAN GAJI BERKALA"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Deskripsi Ringkas
                  </label>
                  <input
                    type="text"
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    placeholder="Penjelasan fungsi dan peruntukan template surat ini..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Variables Selector Panel */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-900">
                      Klik Tag untuk Menyisipkan Variabel Otomatis ke Isi Surat:
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Nilai terisi otomatis saat dicetak</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_TAGS.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariableTag(item.tag)}
                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-mono text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-900 transition shadow-2xs"
                      title={`Sisipkan ${item.label}`}
                    >
                      <Plus className="h-3 w-3 text-indigo-500" />
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Isi Konten */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    Isi Konten Naskah Dokumen *
                  </label>
                </div>
                <textarea
                  rows={10}
                  required
                  value={formIsiKonten}
                  onChange={(e) => setFormIsiKonten(e.target.value)}
                  placeholder="Tuliskan naskah surat di sini. Gunakan tag variabel untuk data dinamis seperti {NAMA_PEGAWAI}, {NIP}, dll."
                  className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Pejabat Penandatangan */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="font-bold text-slate-900 block">
                  Informasi Pejabat Penandatangan Surat
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatNama}
                      onChange={(e) => setFormPejabatNama(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatJabatan}
                      onChange={(e) => setFormPejabatJabatan(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      NIP Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatNip}
                      onChange={(e) => setFormPejabatNip(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tembusan */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Tembusan Surat (Satu baris per tujuan tembusan)
                </label>
                <textarea
                  rows={3}
                  value={formTembusan}
                  onChange={(e) => setFormTembusan(e.target.value)}
                  placeholder="1. Ketua Bawaslu Kabupaten Subang&#10;2. Arsip Kepegawaian"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t">
                {/* Delete button inside editor if modifying an existing template */}
                <div>
                  {editingTemplate && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(editingTemplate)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 font-semibold text-red-700 hover:bg-red-100 transition"
                      title="Hapus template ini secara permanen"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <span>Hapus Template Ini</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800 transition shadow"
                  >
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Simpan Template</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS TEMPLATE ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Hapus Template Dokumen?
                </h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus template berikut dari sistem?
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
              <div className="font-bold text-slate-900 text-xs">{deleteTarget.nama}</div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {KATEGORI_LABELS[deleteTarget.kategori]?.label || deleteTarget.kategori}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {deleteTarget.formatNomor}
                </span>
              </div>
              {deleteTarget.isDefault && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
                  <b>Catatan:</b> Ini adalah salah satu template bawaan standar. Jika dihapus, Anda tetap dapat memulihkannya kapan saja menggunakan tombol <b>Reset Standar</b> di toolbar atas.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
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
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Template'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PRATINJAU & UJI CETAK DOKUMEN ================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[96vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Top Bar with Sample Employee Picker & Print Button */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-700" />
                <span className="font-bold text-slate-900 text-xs">
                  Pratinjau Naskah: {previewTemplate.nama}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Employee Simulator Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-[11px] font-medium text-slate-500">Uji Data:</span>
                  <select
                    value={samplePegawaiId}
                    onChange={(e) => setSamplePegawaiId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none"
                  >
                    {pegawaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} (NIP. {p.nip})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsKopModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Ubah Kop Surat"
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ubah Kop</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs"
                  title="Unduh naskah dinas dalam format PDF"
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
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
              <div
                ref={previewSheetRef}
                className="mx-auto max-w-[210mm] bg-white p-8 sm:p-12 shadow border border-slate-200 text-slate-900 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none"
              >
                {/* KOP SURAT RESMI DINAMIS */}
                <KopSuratHeader
                  config={
                    previewTemplate.kategori === 'surat_pengantar'
                      ? {
                          ...kopConfig,
                          alamatLengkap: 'Jl. Palabuan No. 9, Kel. Sukamelang, Kec. Subang, 41211',
                          teleponFaks: 'Telepon (0260) 4242353',
                          emailWebsite: 'Email: set.subangkab@bawaslu.go.id',
                        }
                      : kopConfig
                  }
                />

                {/* JUDUL DOKUMEN & NOMOR */}
                {(() => {
                  const rendered = renderDocumentText(previewTemplate, activeSamplePegawai);
                  const isSuratPengantar = previewTemplate.kategori === 'surat_pengantar';
                  const contentLines = rendered.renderedContent.split(/\r?\n/);
                  const dateLine = isSuratPengantar ? contentLines.shift() : undefined;
                  const bodyContent = isSuratPengantar
                    ? contentLines.join('\n').trimStart()
                    : rendered.renderedContent;
                  return (
                    <div className="space-y-6 text-xs text-slate-900">
                      {!isSuratPengantar && (
                        <div className="text-center mb-6">
                          <h4 className="font-bold underline text-sm uppercase tracking-wide">
                            {previewTemplate.judulDokumen}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 font-mono">
                            Nomor: {rendered.nomorSurat}
                          </p>
                        </div>
                      )}

                      {/* ISI KONTEN TERRENDER */}
                      <div className="leading-relaxed font-sans">
                        {dateLine !== undefined && (
                          <p className="mb-6 text-right">{dateLine}</p>
                        )}
                        <div className="whitespace-pre-line text-justify">
                          {bodyContent}
                        </div>
                      </div>

                      <TandaTanganCapBlock
                        config={ttdCapConfig}
                        tanggalText={rendered.tanggalFormatted}
                        customNamaPejabat={previewTemplate.penandatanganNama}
                        customJabatan={previewTemplate.penandatanganJabatan}
                        customNip={previewTemplate.penandatanganNip}
                        align="right"
                        mode="pimpinan_saja"
                        hideCap
                        hideSignature
                        className="mt-10"
                      />

                      {/* TEMBUSAN */}
                      {previewTemplate.tembusan && previewTemplate.tembusan.length > 0 && (
                        <div className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-700">
                          <span className="font-semibold block mb-1">Tembusan Yth:</span>
                          <ol className="list-decimal pl-4 space-y-0.5">
                            {previewTemplate.tembusan.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

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
