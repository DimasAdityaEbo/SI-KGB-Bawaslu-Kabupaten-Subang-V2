import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { Pegawai, User as UserType } from '../../types';
import { DIVISI_OPTIONS, AGAMA_OPTIONS, GOLONGAN_OPTIONS } from '../../data/seedData';
import { savePegawai, saveUser, getUsersList } from '../../services/storage';

interface ProfilPegawaiViewProps {
  pegawai: Pegawai;
  currentUser: UserType;
  onRefreshData: () => void;
  onBackToDashboard?: () => void;
}

export const ProfilPegawaiView: React.FC<ProfilPegawaiViewProps> = ({
  pegawai,
  currentUser,
  onRefreshData,
  onBackToDashboard,
}) => {
  const [formData, setFormData] = useState<Pegawai>({ ...pegawai });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setFormData({ ...pegawai });
  }, [pegawai]);

  // Calculate completeness percentage
  const fieldsToCheck = [
    formData.nama,
    formData.nip,
    formData.tempatLahir,
    formData.tanggalLahir,
    formData.jabatan,
    formData.bagianDivisi,
    formData.golonganPangkat,
    formData.noHp,
    formData.email,
    formData.alamatRumah,
    formData.jadwalKgbBerikutnya,
  ];
  const completedFields = fieldsToCheck.filter((f) => Boolean(f && String(f).trim())).length;
  const completeness = Math.round((completedFields / fieldsToCheck.length) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updatedPegawai: Pegawai = {
        ...formData,
        nama: formData.nama.trim(),
        nip: formData.nip.trim(),
        gajiPokokTerakhir: Number(formData.gajiPokokTerakhir) || 0,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to Pegawai store/database
      await savePegawai(updatedPegawai);

      // 2. Synchronize linked User account
      const allUsers = await getUsersList();
      const linkedUser = allUsers.find(
        (u) => u.pegawaiId === updatedPegawai.id || u.username === currentUser.username
      );
      if (linkedUser) {
        const updatedUser: UserType = {
          ...linkedUser,
          namaLengkap: updatedPegawai.nama,
          email: updatedPegawai.email,
          pegawaiId: updatedPegawai.id,
        };
        await saveUser(updatedUser);
      }

      setSaveSuccess(true);
      onRefreshData();
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message || 'Gagal menyimpan perubahan profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white shadow-sm">
              {formData.nama ? formData.nama.charAt(0) : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Profil &amp; Data Diri Pegawai
                </h1>
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                  Data Mandiri
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan lengkapi atau perbarui data kepegawaian pribadi Anda untuk keperluan usulan Kenaikan Gaji Berkala (KGB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">Kelengkapan Profil:</span>
              <span className="font-mono-numbers text-sm font-bold text-slate-900">{completeness}% Lengkap</span>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-xs" style={{
              background: `conic-gradient(#0284c7 ${completeness * 3.6}deg, #e2e8f0 0deg)`
            }}>
              <span className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-[10px] text-slate-700">
                {completeness}%
              </span>
            </div>
          </div>
        </div>

        {/* Completeness Warning If < 100% */}
        {completeness < 100 && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Data Anda Masih Belum Lengkap ({completeness}%)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Pastikan nomor WhatsApp aktif, email resmi, dan TMT KGB diisi dengan benar agar sistem dapat mengirimkan notifikasi pengingat dan surat pengantar permohonan.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">
              Data profil Anda berhasil disimpan dan disinkronkan ke dalam sistem!
            </p>
          </div>
        )}

        {/* Error Alert */}
        {saveError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="font-semibold">{saveError}</p>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: DATA IDENTITAS DIRI */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              1. Identitas Pribadi
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Lengkap (Beserta Gelar Akademik) *
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Dimas Aditya, S.Kom"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* NIP */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nomor Induk Pegawai (NIP / NIK) *
              </label>
              <input
                type="text"
                required
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="199206142019031004"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                NIP juga berfungsi sebagai identitas pengenal utama di Bawaslu.
              </p>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.jenisKelamin || 'Laki-laki'}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Tempat Lahir */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.tempatLahir || ''}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                placeholder="Contoh: Subang"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.tanggalLahir || ''}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Agama */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Agama
              </label>
              <select
                value={formData.agama || 'Islam'}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {AGAMA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: DATA KEPEGAWAIAN & JABATAN */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              2. Data Kepegawaian &amp; Riwayat Golongan
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Jabatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Jabatan
              </label>
              <input
                type="text"
                value={formData.jabatan || ''}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Contoh: Analis Kepegawaian Pertama"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Bagian / Divisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Unit Kerja / Bagian / Divisi
              </label>
              <select
                value={formData.bagianDivisi || DIVISI_OPTIONS[0]}
                onChange={(e) => setFormData({ ...formData, bagianDivisi: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {DIVISI_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Golongan Pangkat */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Pangkat / Golongan Ruang
              </label>
              <select
                value={formData.golonganPangkat || GOLONGAN_OPTIONS[4]}
                onChange={(e) => {
                  const val = e.target.value;
                  const pangkatPart = val.split('/')[0].trim();
                  setFormData({
                    ...formData,
                    golonganPangkat: val,
                    pangkatTerakhir: pangkatPart,
                  });
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {GOLONGAN_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Pangkat Terakhir */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Sebutan Pangkat Terakhir
              </label>
              <input
                type="text"
                value={formData.pangkatTerakhir || ''}
                onChange={(e) => setFormData({ ...formData, pangkatTerakhir: e.target.value })}
                placeholder="Contoh: Penata Muda"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Tanggal Pelantikan */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tanggal TMT Pangkat / Pelantikan
              </label>
              <input
                type="date"
                value={formData.tanggalPelantikan || ''}
                onChange={(e) => setFormData({ ...formData, tanggalPelantikan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Gaji Pokok Terakhir */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Gaji Pokok Terakhir Saat Ini (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={formData.gajiPokokTerakhir || 0}
                onChange={(e) => setFormData({ ...formData, gajiPokokTerakhir: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Jadwal TMT KGB Berikutnya */}
            <div className="sm:col-span-2 rounded-xl bg-amber-50/70 p-4 border border-amber-200">
              <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-700" />
                <span>Jadwal Kenaikan Gaji Berkala (TMT KGB Berikutnya)</span>
              </label>
              <input
                type="date"
                value={formData.jadwalKgbBerikutnya || ''}
                onChange={(e) => setFormData({ ...formData, jadwalKgbBerikutnya: e.target.value })}
                className="w-full sm:w-1/2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-600 focus:outline-none font-mono"
              />
              <p className="mt-1 text-[11px] text-amber-800">
                Tanggal ini adalah batas waktu masa kerja 2 tahun Anda. Sistem akan memunculkan hitung mundur dan notifikasi pengingat pada beranda ketika tanggal mendekati 30 hari lagi.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: KONTAK & DOMISILI */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              3. Kontak &amp; Alamat Domisili
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* No HP / WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                No. HP / WhatsApp Aktif *
              </label>
              <input
                type="text"
                required
                value={formData.noHp || ''}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                placeholder="08123456789"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Digunakan untuk konfirmasi dan koordinasi administrasi berkas.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Alamat Email Aktif *
              </label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="pegawai@gmail.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Penting: seluruh surat tanda terima dan notifikasi KGB dikirimkan ke email ini.
              </p>
            </div>

            {/* Alamat Rumah */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Alamat Tempat Tinggal / Rumah Lengkap
              </label>
              <textarea
                rows={2}
                value={formData.alamatRumah || ''}
                onChange={(e) => setFormData({ ...formData, alamatRumah: e.target.value })}
                placeholder="Jalan, RT/RW, Dusun/Kelurahan, Kecamatan, Kabupaten/Kota..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Alamat Kantor */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Alamat Kantor Bawaslu Subang
              </label>
              <input
                type="text"
                value={formData.alamatKantor || ''}
                onChange={(e) => setFormData({ ...formData, alamatKantor: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs text-slate-500">
            Perubahan data akan otomatis tersinkron ke profil kepegawaian dan akun login Anda.
          </p>

          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Kembali ke Beranda
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow"
            >
              <Save className="h-4 w-4 text-emerald-400" />
              <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Pembaruan Profil'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
