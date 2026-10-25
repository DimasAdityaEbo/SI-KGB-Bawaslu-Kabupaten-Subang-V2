import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Building2,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Trash2,
  Eye,
  Info,
  Sparkles,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { KopSuratConfig } from '../../types';
import {
  getKopSuratConfig,
  saveKopSuratConfig,
  resetKopSuratConfig,
  DEFAULT_KOP_SURAT,
  isCurrentUserAdmin,
} from '../../services/storage';
import { KopSuratHeader } from '../KopSuratHeader';

interface KopSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newConfig: KopSuratConfig) => void;
  isAdmin?: boolean;
}

export const KopSuratModal: React.FC<KopSuratModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isAdmin,
}) => {
  const effectiveIsAdmin = isAdmin !== undefined ? isAdmin : isCurrentUserAdmin();
  const [config, setConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(getKopSuratConfig());
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    if (!effectiveIsAdmin) {
      alert('Akses ditolak: Hanya Administrator yang berwenang mengubah logo Kop Surat.');
      return;
    }
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
    if (!effectiveIsAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!effectiveIsAdmin) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveCustomLogo = () => {
    if (!effectiveIsAdmin) {
      alert('Akses ditolak: Hanya Administrator yang berwenang menghapus logo Kop Surat.');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    if (!effectiveIsAdmin) {
      alert('Akses ditolak: Hanya Administrator yang berwenang mereset Kop Surat.');
      return;
    }
    if (
      confirm(
        'Yakin ingin mengembalikan seluruh pengaturan kop surat ke format standar Bawaslu Kabupaten Subang?'
      )
    ) {
      const reset = resetKopSuratConfig(true);
      setConfig(reset);
      setSuccessMsg('Kop surat berhasil direset ke standar Bawaslu Subang.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onSaved) onSaved(reset);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveIsAdmin) {
      alert('Akses ditolak: Hanya Administrator yang berwenang mengubah Kop Surat.');
      return;
    }

    if (!config.namaInstansiUtama.trim()) {
      alert('Nama Instansi Utama wajib diisi!');
      return;
    }

    const saved = saveKopSuratConfig(config, true);
    setSuccessMsg('Pengaturan Kop Surat berhasil disimpan!');
    if (onSaved) {
      onSaved(saved);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="flex my-6 w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Pengaturan Kop Surat &amp; Identitas Naskah Dinas
                </h2>
                {effectiveIsAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Mode Admin (Akses Penuh)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    <Lock className="h-3 w-3" />
                    Khusus Admin (Mode Baca)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Sesuaikan nama instansi, alamat, kontak, dan logo untuk pencetakan dokumen dinas &amp; SK KGB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* REALTIME LIVE PREVIEW BOX */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Pratinjau Langsung Kop Surat (Live Preview)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Akan otomatis diterapkan pada seluruh cetakan dokumen dinas
              </span>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200/80">
              <KopSuratHeader config={config} />
              <div className="text-center text-[11px] text-slate-400 italic">
                [... Isi Dokumen Naskah Dinas / SK KGB / Lembar Disposisi ...]
              </div>
            </div>
          </div>

          {!effectiveIsAdmin && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Akses Terbatas: Hanya Administrator yang Berwenang Mengubah Kop Surat</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Pengaturan identitas naskah dinas, alamat instansi, dan logo resmi hanya dapat diubah oleh Administrator Bawaslu demi menjaga keabsahan dokumen kenegaraan. Anda hanya dapat melihat pratinjau format yang sedang aktif.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <fieldset disabled={!effectiveIsAdmin} className="space-y-6">
            {/* SECTION 1: LOGO UPLOAD & ADJUSTMENT */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Logo Kop Surat
                  </h3>
                </div>
                {config.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Logo Kustom (Gunakan Logo Bawaslu)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Drag and Drop Upload Area */}
                <div className="md:col-span-8">
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
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <Upload className="h-7 w-7 text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk unggah atau seret file gambar ke sini
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung format PNG, JPG, JPEG, SVG, WebP (Maksimal 5 MB). Disarankan menggunakan logo dengan latar transparan (PNG).
                    </p>
                  </div>
                </div>

                {/* Logo Preview & Slider */}
                <div className="md:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Status Logo:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        config.logoUrl
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {config.logoUrl ? 'Logo Kustom Diunggah' : 'Logo Bawaslu Standar'}
                    </span>
                  </div>

                  {/* Size slider */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                      <span>Ukuran Lebar Logo:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {config.logoWidthPx || 80} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="130"
                      step="5"
                      value={config.logoWidthPx || 80}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          logoWidthPx: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>50px (Kecil)</span>
                      <span>80px (Normal)</span>
                      <span>130px (Besar)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TEKS INSTANSI & ALAMAT */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Identitas Instansi & Alamat Kantor
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Instansi Utama */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Instansi Utama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.namaInstansiUtama}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, namaInstansiUtama: e.target.value }))
                    }
                    placeholder="Contoh: BADAN PENGAWAS PEMILIHAN UMUM"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Baris teks utama paling atas pada kop surat
                  </span>
                </div>

                {/* Nama Instansi Sub / Daerah */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Satuan Kerja / Daerah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.namaInstansiSub}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, namaInstansiSub: e.target.value }))
                    }
                    placeholder="Contoh: KABUPATEN SUBANG"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Baris teks tebal (bold) kedua pada kop surat
                  </span>
                </div>

                {/* Unit Kerja (Opsional) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unit Kerja / Bagian (Opsional)
                  </label>
                  <input
                    type="text"
                    value={config.unitKerja || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, unitKerja: e.target.value }))
                    }
                    placeholder="Contoh: SEKRETARIAT (dikosongkan jika tidak perlu)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Gaya Garis Pembatas */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Gaya Garis Pembatas Kop
                  </label>
                  <select
                    value={config.garisKopGaya || 'ganda'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        garisKopGaya: e.target.value as 'ganda' | 'tunggal' | 'tebal',
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="ganda">Garis Ganda Dinas (Standar Resmi Naskah Dinas)</option>
                    <option value="tunggal">Garis Tunggal Ramping</option>
                    <option value="tebal">Garis Tunggal Tebal</option>
                  </select>
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Alamat Lengkap Kantor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.alamatLengkap}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, alamatLengkap: e.target.value }))
                    }
                    placeholder="Contoh: Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Nomor Telepon / Faks */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor Telepon & Faks
                  </label>
                  <input
                    type="text"
                    value={config.teleponFaks || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, teleponFaks: e.target.value }))
                    }
                    placeholder="Contoh: Telp: (0260) 417890 · Faks: (0260) 417891"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                  />
                </div>

                {/* Website & Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Laman Website & Email Resmi
                  </label>
                  <input
                    type="text"
                    value={config.emailWebsite || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, emailWebsite: e.target.value }))
                    }
                    placeholder="Contoh: Laman: subang.bawaslu.go.id · Pos-el: bawaslukabsubang@gmail.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            </fieldset>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-200">
              {effectiveIsAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reset ke Standar Bawaslu Subang</span>
                  </button>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Simpan Perubahan Kop Surat</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-slate-500 italic flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Format kop surat dikunci (hanya dapat diubah oleh Administrator)
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
