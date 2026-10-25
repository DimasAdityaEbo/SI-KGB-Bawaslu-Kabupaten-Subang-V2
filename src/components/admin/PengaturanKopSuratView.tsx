import React, { useState, useRef } from 'react';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Trash2,
  Eye,
  Info,
  Sparkles,
} from 'lucide-react';
import { KopSuratConfig } from '../../types';
import {
  getKopSuratConfig,
  saveKopSuratConfig,
  resetKopSuratConfig,
  DEFAULT_KOP_SURAT,
} from '../../services/storage';
import { KopSuratHeader } from '../KopSuratHeader';

interface PengaturanKopSuratViewProps {
  onRefreshData?: () => void;
}

export const PengaturanKopSuratView: React.FC<PengaturanKopSuratViewProps> = ({
  onRefreshData,
}) => {
  const [config, setConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, SVG, WebP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setConfig((prev) => ({
          ...prev,
          logoUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveCustomLogo = () => {
    setConfig((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Yakin ingin mengembalikan seluruh pengaturan kop surat ke format standar Bawaslu Kabupaten Subang?'
      )
    ) {
      const reset = resetKopSuratConfig(true);
      setConfig(reset);
      setSuccessMsg('Kop surat berhasil direset ke standar Bawaslu Subang.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.namaInstansiUtama.trim()) {
      alert('Nama Instansi Utama wajib diisi!');
      return;
    }

    saveKopSuratConfig(config, true);
    setSuccessMsg('Pengaturan Kop Surat berhasil disimpan dan langsung diterapkan ke dokumen cetak!');
    setTimeout(() => setSuccessMsg(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 mb-1">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            Wewenang Kasubag Administrasi
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Pengaturan Kop Surat &amp; Identitas Naskah Dinas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan kop surat resmi, logo dinas, alamat satker, telepon, email, serta garis pemisah untuk dokumen pengantar dan SK KGB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset Standar</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* REALTIME LIVE PREVIEW BOX */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pratinjau Langsung Kop Surat (Live Preview)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Otomatis terhubung dengan Surat Usulan Provinsi, Bukti Tanda Terima, dan SK KGB
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <KopSuratHeader config={config} />
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 text-xs">
        {/* Section 1: Logo Instansi */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-600" />
            <span>Logo Instansi Bawaslu</span>
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Upload Area */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Upload Logo Baru (PNG / SVG Transparan disarankan)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Klik untuk memilih file logo atau seret gambar ke sini
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mendukung PNG, SVG, JPG (Maks. 5 MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {config.logoUrl && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                  <span className="text-slate-600 font-medium">Logo kustom aktif terpasang</span>
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="flex items-center gap-1 font-semibold text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Logo Kustom</span>
                  </button>
                </div>
              )}
            </div>

            {/* Slider & Style */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-slate-500" />
                    <span>Ukuran Lebar Logo pada Dokumen</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {config.logoWidthPx || 80} px
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="140"
                  step="5"
                  value={config.logoWidthPx || 80}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      logoWidthPx: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Kecil (50px)</span>
                  <span>Standar (80px)</span>
                  <span>Besar (140px)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Gaya Garis Pemisah Kop (Separator)
                </label>
                <select
                  value={config.garisKopGaya || 'ganda'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      garisKopGaya: e.target.value as any,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value="ganda">Garis Ganda Dinas (Tebal &amp; Tipis - Standar Instansi)</option>
                  <option value="tunggal">Garis Tunggal Bersih</option>
                  <option value="tebal">Garis Hitam Tebal</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Teks Instansi & Alamat */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-600" />
            <span>Teks Identitas Lembaga &amp; Alamat Satker</span>
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Nama Instansi Utama (Baris 1) *
              </label>
              <input
                type="text"
                required
                value={config.namaInstansiUtama}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    namaInstansiUtama: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="BADAN PENGAWAS PEMILIHAN UMUM"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Nama Instansi Sub / Wilayah (Baris 2) *
              </label>
              <input
                type="text"
                required
                value={config.namaInstansiSub}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    namaInstansiSub: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="KABUPATEN SUBANG"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Unit Kerja / Sub Bagian (Baris 3 - Opsional)
              </label>
              <input
                type="text"
                value={config.unitKerja || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    unitKerja: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="SEKRETARIAT"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Alamat Kantor Lengkap *
              </label>
              <textarea
                rows={2}
                required
                value={config.alamatLengkap}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    alamatLengkap: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="Jl. Palabuan No.9, Kelurahan Sukamelang, Kecamatan Subang, Kabupaten Subang, Jawa Barat"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Telepon / Faks
              </label>
              <input
                type="text"
                value={config.teleponFaks || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    teleponFaks: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="Telepon: (0260) 412345"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Kode Pos
              </label>
              <input
                type="text"
                value={config.kodePos || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    kodePos: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="41211"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Email &amp; Laman Web Resmi
              </label>
              <input
                type="text"
                value={config.emailWebsite || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    emailWebsite: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="Email: set.subang@bawaslu.go.id | Laman: subang.bawaslu.go.id"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Simpan Perubahan Kop Surat</span>
          </button>
        </div>
      </form>
    </div>
  );
};
