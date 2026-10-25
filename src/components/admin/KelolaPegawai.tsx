import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  UserPlus,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Filter,
  Eye,
  KeyRound,
  Copy,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Pegawai, User } from '../../types';
import { DIVISI_OPTIONS, AGAMA_OPTIONS, GOLONGAN_OPTIONS } from '../../data/seedData';
import { savePegawai, deletePegawai, saveUser, getUsersList } from '../../services/storage';

interface KelolaPegawaiProps {
  pegawaiList: Pegawai[];
  onRefreshData: () => void;
}

function generateUsernameFromNama(nama: string, existingUsernames: string[]): string {
  // Strip academic titles after comma (e.g. "Dimas Ebo Kurniawan, S.IP" -> "Dimas Ebo Kurniawan")
  const withoutTitle = nama.split(',')[0].trim();
  // Strip prefixes like Drs., Dra., Ir., H., Hj.
  const withoutPrefix = withoutTitle.replace(/^(h\.|hj\.|dr\.|drs\.|dra\.|ir\.)\s+/i, '');
  // Extract words
  const words = withoutPrefix.toLowerCase().split(/\s+/).filter(Boolean);
  let base = words.length > 0 ? words[0].replace(/[^a-z0-9]/g, '') : 'pegawai';
  if (!base) base = 'pegawai';

  let candidate = base;
  let counter = 2;
  while (existingUsernames.includes(candidate)) {
    if (words.length > 1 && counter === 2) {
      candidate = `${words[0]}.${words[1]}`.replace(/[^a-z0-9.]/g, '');
    } else {
      candidate = `${base}${counter}`;
    }
    counter++;
  }
  return candidate;
}

export const KelolaPegawai: React.FC<KelolaPegawaiProps> = ({
  pegawaiList,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);
  const [detailModalPegawai, setDetailModalPegawai] = useState<Pegawai | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [migrationCopyMessage, setMigrationCopyMessage] = useState<string | null>(null);

  // Success modal for created user credentials
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{
    nama: string;
    username: string;
    nip: string;
  } | null>(null);
  const [copiedInfo, setCopiedInfo] = useState(false);

  const optionalDatesMigrationSql = `ALTER TABLE public.pegawai
  ALTER COLUMN tanggal_lahir DROP NOT NULL,
  ALTER COLUMN tanggal_pelantikan DROP NOT NULL;`;

  // Form State: Hanya Nama dan NIP yang wajib bagi Admin
  const initialForm: Partial<Pegawai> = {
    nama: '',
    nip: '',
    tempatLahir: '',
    tanggalLahir: '',
    jabatan: '',
    jenisKelamin: 'Laki-laki',
    bagianDivisi: DIVISI_OPTIONS[0],
    noHp: '',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: '',
    email: '',
    agama: 'Islam',
    tanggalPelantikan: '',
    jadwalKgbBerikutnya: '',
    gajiPokokTerakhir: 0,
    golonganPangkat: GOLONGAN_OPTIONS[4],
    pangkatTerakhir: 'Penata Muda',
  };

  const [formData, setFormData] = useState<Partial<Pegawai>>(initialForm);

  const handleOpenAdd = () => {
    setSelectedPegawai(null);
    setFormData(initialForm);
    setSaveError(null);
    setMigrationCopyMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Pegawai) => {
    setSelectedPegawai(p);
    setFormData(p);
    setSaveError(null);
    setMigrationCopyMessage(null);
    setIsModalOpen(true);
  };

  const handleCopyDateMigration = async () => {
    try {
      await navigator.clipboard.writeText(optionalDatesMigrationSql);
      setMigrationCopyMessage('SQL berhasil disalin. Jalankan di Supabase SQL Editor, lalu coba simpan pegawai kembali.');
    } catch (err) {
      console.error('Gagal menyalin SQL migrasi:', err);
      setMigrationCopyMessage('SQL tidak dapat disalin otomatis. Salin perintah yang tampil di bawah secara manual.');
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus data pegawai "${nama}"?`)) {
      await deletePegawai(id);
      onRefreshData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim() || !formData.nip?.trim()) {
      alert('Nama Pegawai dan NIP wajib diisi oleh Admin!');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const isNew = !selectedPegawai;
      const currentUsers = await getUsersList();
      const existingUsernames = currentUsers.map((u) => u.username.toLowerCase());
      const username = generateUsernameFromNama(formData.nama.trim(), existingUsernames);

      // Default fallback jika data opsional tidak diisi admin
      const emailValue = formData.email?.trim() || `${username}@bawaslu-subang.go.id`;
      const nextKgbDefault = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const nextKgbValue = formData.jadwalKgbBerikutnya?.trim() || nextKgbDefault;

      const payload: Pegawai = {
        id: selectedPegawai?.id || `peg-${Date.now()}`,
        nama: formData.nama.trim(),
        nip: formData.nip.trim(),
        tempatLahir: formData.tempatLahir?.trim() || '',
        tanggalLahir: formData.tanggalLahir || '',
        jabatan: formData.jabatan?.trim() || 'Staf / Pegawai',
        jenisKelamin: (formData.jenisKelamin as 'Laki-laki' | 'Perempuan') || 'Laki-laki',
        bagianDivisi: formData.bagianDivisi || DIVISI_OPTIONS[0],
        noHp: formData.noHp?.trim() || '',
        alamatKantor: formData.alamatKantor?.trim() || 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
        alamatRumah: formData.alamatRumah?.trim() || '',
        email: emailValue,
        agama: formData.agama || 'Islam',
        tanggalPelantikan: formData.tanggalPelantikan || '',
        jadwalKgbBerikutnya: nextKgbValue,
        gajiPokokTerakhir: Number(formData.gajiPokokTerakhir) || 0,
        golonganPangkat: formData.golonganPangkat || GOLONGAN_OPTIONS[4],
        pangkatTerakhir: formData.pangkatTerakhir || 'Penata Muda',
        createdAt: selectedPegawai?.createdAt || new Date().toISOString(),
      };

      await savePegawai(payload);

      // Auto-create User account when adding a new Pegawai
      if (isNew) {
        const currentUsers = await getUsersList();
        const existingUsernames = currentUsers.map((u) => u.username.toLowerCase());
        const username = generateUsernameFromNama(payload.nama, existingUsernames);

        const newUser: User = {
          id: `usr-${Date.now()}`,
          username: username,
          password: payload.nip.trim(), // NIP sebagai password default!
          role: 'pegawai',
          pegawaiId: payload.id,
          namaLengkap: payload.nama,
          email: payload.email,
          status: 'aktif',
          createdAt: new Date().toISOString(),
        };

        await saveUser(newUser);

        setCreatedAccountInfo({
          nama: payload.nama,
          username,
          nip: payload.nip.trim(),
        });
      } else {
        // When updating existing employee, synchronize linked User record
        const currentUsers = await getUsersList();
        const linkedUser = currentUsers.find(
          (u) => u.pegawaiId === payload.id || (selectedPegawai && u.namaLengkap === selectedPegawai.nama)
        );
        if (linkedUser) {
          const updatedUser: User = {
            ...linkedUser,
            pegawaiId: payload.id,
            namaLengkap: payload.nama,
            email: payload.email,
          };
          await saveUser(updatedUser);
        }
      }

      setIsModalOpen(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      const requiresDateMigration =
        message.includes('null value in column "tanggal_lahir"') ||
        message.includes('null value in column "tanggal_pelantikan"');
      setSaveError(
        requiresDateMigration
          ? 'Database Supabase masih mewajibkan tanggal lahir atau tanggal pelantikan. Jalankan migrasi di bawah satu kali agar kedua tanggal dapat dikosongkan.'
          : `Data pegawai gagal disimpan: ${message}`
      );
      setMigrationCopyMessage(null);
      onRefreshData();
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered List
  const filteredList = pegawaiList.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivisi = filterDivisi === 'ALL' || p.bagianDivisi === filterDivisi;
    return matchesSearch && matchesDivisi;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Kelola Data Pegawai Bawaslu Subang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen arsip profil kepegawaian, jabatan, NIP, serta tanggal pengajuan kenaikan gaji berkala (KGB).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pegawai, NIP, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Bagian / Divisi</option>
            {DIVISI_OPTIONS.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Pegawai Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Nama Pegawai & NIP</th>
                <th className="py-3 px-4 font-semibold">Jabatan & Bagian</th>
                <th className="py-3 px-4 font-semibold">Pangkat / Gol.</th>
                <th className="py-3 px-4 font-semibold">Jadwal KGB Berikutnya</th>
                <th className="py-3 px-4 font-semibold">Kontak</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data pegawai yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => {
                  const today = new Date();
                  const kgbDate = new Date(p.jadwalKgbBerikutnya);
                  const diffDays = Math.ceil((kgbDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isSoon = diffDays >= 0 && diffDays <= 30;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.nama}</p>
                        <p className="font-mono text-[11px] text-slate-500">NIP: {p.nip}</p>
                        <p className="text-[10px] text-slate-400">{p.tempatLahir}, {p.tanggalLahir}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{p.jabatan}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{p.bagianDivisi}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.golonganPangkat || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 font-mono">{p.jadwalKgbBerikutnya}</p>
                        {isSoon && (
                          <span className="font-mono-numbers mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                            {diffDays} hari lagi (&lt; 1 bln)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-mono text-[11px]">{p.noHp}</p>
                        <p className="text-[10px] text-slate-400">{p.email}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModalPegawai(p)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Lihat Detail Profil Lengkap"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit Data Pegawai"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nama)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailModalPegawai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Detail Lengkap Pegawai</h3>
              <button
                onClick={() => setDetailModalPegawai(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Nama Lengkap</span>
                <span className="font-bold text-slate-900">{detailModalPegawai.nama}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">NIP</span>
                <span className="font-mono text-slate-900">{detailModalPegawai.nip}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                <span>{detailModalPegawai.tempatLahir}, {detailModalPegawai.tanggalLahir}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Jenis Kelamin</span>
                <span>{detailModalPegawai.jenisKelamin}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Agama</span>
                <span>{detailModalPegawai.agama}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Jabatan</span>
                <span className="font-semibold">{detailModalPegawai.jabatan}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Bagian / Divisi</span>
                <span>{detailModalPegawai.bagianDivisi}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Pangkat / Golongan</span>
                <span>{detailModalPegawai.golonganPangkat || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Tanggal Pelantikan</span>
                <span className="font-mono">{detailModalPegawai.tanggalPelantikan}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Jadwal Pengajuan KGB</span>
                <span className="font-mono font-bold text-amber-900">{detailModalPegawai.jadwalKgbBerikutnya}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">No. Handphone (WhatsApp)</span>
                <span className="font-mono">{detailModalPegawai.noHp}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Surel Resmi</span>
                <span>{detailModalPegawai.email}</span>
              </div>
              <div className="border-b pb-2">
                <span className="text-slate-500 block mb-1">Alamat Kantor:</span>
                <span className="text-slate-800">{detailModalPegawai.alamatKantor}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Alamat Rumah:</span>
                <span className="text-slate-800">{detailModalPegawai.alamatRumah || '-'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailModalPegawai(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {selectedPegawai ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru Bawaslu Subang'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Info guidance banner */}
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sky-950 text-xs flex items-start gap-2.5 sm:col-span-2">
                  <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Ketentuan Pengisian Pegawai Baru:</p>
                    <p className="text-[11px] text-sky-800 mt-0.5 leading-relaxed">
                      Admin <strong>hanya wajib mengisi Nama dan NIP</strong>. Semua data kepegawaian lainnya bersifat opsional dan dapat diisi/dilengkapi secara mandiri oleh pegawai saat login ke akunnya masing-masing.
                    </p>
                  </div>
                </div>

                {saveError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 sm:col-span-2"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p>{saveError}</p>
                      {(saveError.includes('Database Supabase masih mewajibkan tanggal') ||
                        saveError.includes('SQL tidak dapat disalin otomatis')) && (
                        <>
                          <pre className="mt-2 overflow-x-auto rounded bg-white p-2 font-mono text-[11px] text-slate-800">
                            {optionalDatesMigrationSql}
                          </pre>
                          <button
                            type="button"
                            onClick={handleCopyDateMigration}
                            className="mt-2 rounded-md bg-red-700 px-2.5 py-1.5 font-semibold text-white hover:bg-red-800"
                          >
                            Salin SQL Perbaikan
                          </button>
                          {migrationCopyMessage && (
                            <p className="mt-1 text-[11px]">{migrationCopyMessage}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Nama Pegawai */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nama Pegawai (Lengkap dengan Gelar) <span className="text-red-600 font-bold">* (Wajib diisi Admin)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Dimas Ebo Kurniawan, S.IP"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* NIP */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    NIP / NIK <span className="text-red-600 font-bold">* (Wajib diisi Admin - Password Awal)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="199206142019031004"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    NIP ini otomatis menjadi password awal akun pegawai.
                  </p>
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Jenis Kelamin <span className="text-slate-400 font-normal">(Opsional)</span>
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
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tempat Lahir <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    placeholder="Subang"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {selectedPegawai && (
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Tanggal Lahir <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                {/* Jabatan */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Jabatan <span className="text-slate-400 font-normal">(Opsional / Dapat diisi pegawai)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Analis Kepegawaian Pertama"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Bagian / Divisi */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Bagian / Divisi <span className="text-slate-400 font-normal">(Opsional)</span>
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

                {/* Pangkat / Golongan */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Golongan Pangkat <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <select
                    value={formData.golonganPangkat || GOLONGAN_OPTIONS[4]}
                    onChange={(e) => setFormData({ ...formData, golonganPangkat: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    {GOLONGAN_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agama */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Agama <span className="text-slate-400 font-normal">(Opsional)</span>
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

                {selectedPegawai && (
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Tanggal Pelantikan <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalPelantikan || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalPelantikan: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                {/* Jadwal Pengajuan Kenaikan Gaji Berkala (KGB) */}
                <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200">
                  <label className="block font-bold text-amber-950 mb-1">
                    Jadwal Kenaikan Gaji Berkala (TMT KGB Berikutnya) <span className="text-slate-500 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.jadwalKgbBerikutnya || ''}
                    onChange={(e) => setFormData({ ...formData, jadwalKgbBerikutnya: e.target.value })}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-amber-800">
                    Jika dikosongkan, sistem akan mengotomatiskan 2 tahun dari sekarang atau dapat diisi mandiri oleh pegawai.
                  </p>
                </div>

                {/* No HP */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    No. HP / WhatsApp <span className="text-slate-400 font-normal">(Opsional / Dapat diisi pegawai)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="081223456789"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Email Resmi Pegawai <span className="text-slate-400 font-normal">(Opsional / Dapat diisi pegawai)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pegawai@bawaslu-subang.go.id"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Alamat Kantor */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Alamat Kantor <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.alamatKantor || ''}
                    onChange={(e) => setFormData({ ...formData, alamatKantor: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Alamat Rumah */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Alamat Rumah Lengkap <span className="text-slate-400 font-normal">(Opsional / Dapat diisi pegawai)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamatRumah || ''}
                    onChange={(e) => setFormData({ ...formData, alamatRumah: e.target.value })}
                    placeholder="Nama jalan, RT/RW, kelurahan/desa, kecamatan..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Data Pegawai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT CREATED NOTIFICATION MODAL */}
      {createdAccountInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Pegawai &amp; Akun Pengguna Berhasil Dibuat!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Akun pengguna otomatis terdaftar untuk <strong>{createdAccountInfo.nama}</strong>:
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Username Login:</span>
                <span className="font-mono font-bold text-slate-900">{createdAccountInfo.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Password Default:</span>
                <span className="font-mono font-bold text-emerald-800">{createdAccountInfo.nip} (NIP)</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                Pegawai dapat langsung masuk dengan kredensial ini dan mengubah password kapan saja melalui menu akun.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Akun SI-KGB Bawaslu Subang\nNama: ${createdAccountInfo.nama}\nUsername: ${createdAccountInfo.username}\nPassword Default: ${createdAccountInfo.nip}`
                  );
                  setCopiedInfo(true);
                  setTimeout(() => setCopiedInfo(false), 2500);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copiedInfo ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin Kredensial</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setCreatedAccountInfo(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
