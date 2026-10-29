import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Check,
  Search,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { User, Pegawai, UserRole } from '../../types';
import { saveUser, deleteUser } from '../../services/storage';

interface KelolaUserProps {
  usersList: User[];
  pegawaiList: Pegawai[];
  onRefreshData: () => void;
}

export const KelolaUser: React.FC<KelolaUserProps> = ({
  usersList,
  pegawaiList,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sqlFix, setSqlFix] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('kasubag');
  const [selectedPegawaiId, setSelectedPegawaiId] = useState('');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setUsername('kasubag');
    setPassword('password123');
    setRole('kasubag');
    setNamaLengkap('Kepala Sub Bagian Administrasi Bawaslu Subang');
    setEmail('kasubag@bawaslu-subang.go.id');
    setSelectedPegawaiId('');
    setStatus('aktif');
    setFormError(null);
    setSqlFix(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(user.password || '');
    setNamaLengkap(user.namaLengkap);
    setEmail(user.email);
    setRole(user.role);
    setSelectedPegawaiId(user.pegawaiId || '');
    setStatus(user.status);
    setFormError(null);
    setSqlFix(null);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setFormError(null);
    if (!selectedUser) {
      if (newRole === 'kasubag') {
        if (!username || username === 'admin') setUsername('kasubag');
        if (!namaLengkap || namaLengkap.includes('Administrator')) setNamaLengkap('Kepala Sub Bagian Administrasi Bawaslu Subang');
        if (!email || email.includes('admin@')) setEmail('kasubag@bawaslu-subang.go.id');
      } else if (newRole === 'admin') {
        if (!username || username === 'kasubag') setUsername('admin');
        if (!namaLengkap || namaLengkap.includes('Kasubag')) setNamaLengkap('Administrator Sistem Bawaslu Subang');
        if (!email || email.includes('kasubag@')) setEmail('admin@bawaslu-subang.go.id');
      } else if (newRole === 'pegawai') {
        const firstPeg = pegawaiList[0];
        if (firstPeg) {
          setSelectedPegawaiId(firstPeg.id);
          setNamaLengkap(firstPeg.nama);
          setEmail(firstPeg.email);
          const nick = firstPeg.nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          setUsername(nick);
        }
      }
    }
  };

  const handlePegawaiChange = (pegawaiId: string) => {
    setSelectedPegawaiId(pegawaiId);
    const chosen = pegawaiList.find((p) => p.id === pegawaiId);
    if (chosen) {
      setNamaLengkap(chosen.nama);
      setEmail(chosen.email);
      if (role === 'pegawai' && (!selectedUser || !username)) {
        const nick = chosen.nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(nick);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus akun pengguna "${name}"?`)) {
      await deleteUser(id);
      onRefreshData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSqlFix(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setFormError('Username tidak boleh kosong!');
      return;
    }

    if (!namaLengkap.trim()) {
      setFormError('Nama lengkap pengguna wajib diisi!');
      return;
    }

    // Check duplicate username
    const duplicate = usersList.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.id !== selectedUser?.id
    );
    if (duplicate) {
      setFormError(
        `Username "${cleanUsername}" sudah digunakan oleh akun "${duplicate.namaLengkap}". Silakan gunakan username lain.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const userPayload: User = {
        id: selectedUser?.id || `usr-${Date.now()}`,
        username: cleanUsername,
        password: password.trim(),
        role,
        pegawaiId: selectedPegawaiId || undefined,
        namaLengkap: namaLengkap.trim(),
        email: email.trim() || `${cleanUsername}@bawaslu-subang.go.id`,
        status,
        createdAt: selectedUser?.createdAt || new Date().toISOString(),
        lastLogin: selectedUser?.lastLogin,
      };

      await saveUser(userPayload);
      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      console.warn('KelolaUser submit caught error:', err);
      if (
        err.message?.includes('KASUBAG_CHECK_CONSTRAINT') ||
        err.message?.includes('users_role_check') ||
        err.message?.includes('violates check constraint')
      ) {
        setFormError(
          `Akun berhasil dibuat dan disimpan secara lokal (dapat langsung digunakan untuk login). Namun database cloud Supabase Anda menolak role 'kasubag' karena tabel masih memakai constraint lama. Jalankan migrasi berikut di Supabase SQL Editor:`
        );
        setSqlFix(
          `ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;\nALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'pegawai', 'kasubag'));`
        );
        // Refresh anyway so local user appears in table
        onRefreshData();
      } else {
        setFormError(err.message || 'Gagal menyimpan pengguna. Silakan coba kembali.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Kelola Akun Pengguna &amp; Akses Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen kredensial login (username &amp; password), hak akses peranan (Role Admin / Pegawai), serta penautan profil.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Akun Pengguna</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan username, nama lengkap, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Nama Lengkap &amp; Email</th>
                <th className="py-3 px-4 font-semibold">Role Akses</th>
                <th className="py-3 px-4 font-semibold">Status Akun</th>
                <th className="py-3 px-4 font-semibold">Password Saat Ini</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {user.username}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{user.namaLengkap}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                        <ShieldCheck className="h-3 w-3" /> Administrator
                      </span>
                    ) : user.role === 'kasubag' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                        <ShieldCheck className="h-3 w-3 text-amber-600" /> Kasubag
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                        Pegawai ASN
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.status === 'aktif' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    •••••••• ({user.password ? user.password.replace(/./g, '•') : '••••••••'})
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Username & Password"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Hapus Akun Pengguna"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {selectedUser ? 'Edit Username & Password' : 'Buat Akun Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{formError}</div>
                </div>

                {sqlFix && (
                  <div className="mt-2 rounded border border-amber-300/80 bg-white p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-700">
                        Query SQL untuk Supabase SQL Editor:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sqlFix);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-slate-800 transition"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="font-mono text-[10px] text-slate-800 overflow-x-auto p-1.5 bg-slate-50 rounded border border-slate-200 select-all">
                      {sqlFix}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Role Akses Pengguna *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value="kasubag">Kasubag (Kepala Sub Bagian Administrasi)</option>
                  <option value="pegawai">Pegawai ASN / Non-ASN</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>

              {/* Tautkan Pegawai: Wajib untuk Pegawai, Opsional untuk Kasubag */}
              {(role === 'pegawai' || role === 'kasubag') && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {role === 'pegawai'
                      ? 'Tautkan ke Data Pegawai Bawaslu *'
                      : 'Tautkan ke Data Pegawai Bawaslu (Opsional)'}
                  </label>
                  <select
                    value={selectedPegawaiId}
                    onChange={(e) => handlePegawaiChange(e.target.value)}
                    required={role === 'pegawai'}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="">
                      {role === 'pegawai'
                        ? '-- Pilih Pegawai Terkait --'
                        : '-- Tanpa Tautan (Gunakan Nama & Email Manual) --'}
                    </option>
                    {pegawaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} (NIP: {p.nip})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {role === 'pegawai'
                      ? 'Pengguna ini akan secara otomatis mengisi formulir KGB berdasarkan data pegawai ini.'
                      : 'Opsional: Jika Kasubag juga terdaftar pada database pegawai, nama dan email akan terisi otomatis.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Nama Lengkap Pengguna *
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Drs. H. Tatang Koswara / Kepala Sub Bagian Administrasi"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Email Pengguna *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: kasubag@bawaslu-subang.go.id"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: kasubag / kasubag_admin"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Password Pengguna *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Password ini akan digunakan saat login ke dalam sistem.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Status Akun
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value="aktif">Aktif (Dapat Login)</option>
                  <option value="nonaktif">Nonaktif (Diblokir)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Kredensial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
