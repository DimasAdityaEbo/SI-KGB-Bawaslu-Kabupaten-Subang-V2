import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  FileCode,
} from 'lucide-react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseClient,
  normalizeSupabaseUrl,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabase';
import { createClient } from '@supabase/supabase-js';
import { Pegawai, User, PengajuanKGB } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
  allPegawai: Pegawai[];
  allUsers: User[];
  allPengajuan: PengajuanKGB[];
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  allPegawai,
  allUsers,
  allPengajuan,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSavedSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Harap masukkan Supabase URL dan Anon Key terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testClient = createClient(cleanUrl, cleanKey);
      // Test querying the auth or health check
      const { data, error } = await testClient.from('pegawai').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, but client connected
        if (error.message.includes('relation "public.pegawai" does not exist')) {
          setTestResult({
            success: true,
            message:
              'Koneksi Supabase BERHASIL! (Catatan: Tabel belum dibuat. Silakan salin & jalankan Skema SQL di bawah pada Supabase SQL Editor).',
          });
        } else {
          setTestResult({
            success: false,
            message: `Gagal menghubungkan ke Supabase: ${error.message}`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'Koneksi ke Supabase berhasil dan tabel pegawai siap digunakan!',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Terjadi kesalahan jaringan atau URL tidak valid: ${err.message || err}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();
    saveSupabaseConfig(cleanUrl, cleanKey);
    setUrl(cleanUrl);
    resetSupabaseClient();
    onConfigChanged();
    setTestResult({
      success: true,
      message: 'Konfigurasi Supabase berhasil disimpan dan terhubung!',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyMigrationSql = () => {
    const migrationSql = `ALTER TABLE public.pegawai
  ALTER COLUMN tanggal_lahir DROP NOT NULL,
  ALTER COLUMN tanggal_pelantikan DROP NOT NULL,
  ALTER COLUMN jadwal_kgb_berikutnya DROP NOT NULL;
ALTER TABLE public.pengajuan_kgb
  ADD COLUMN IF NOT EXISTS dokumen_sk_kgb_diterbitkan JSONB;
ALTER TABLE public.pengajuan_kgb DROP CONSTRAINT IF EXISTS pengajuan_kgb_status_check;
ALTER TABLE public.pengajuan_kgb ADD CONSTRAINT pengajuan_kgb_status_check 
  CHECK (status IN ('menunggu_verifikasi', 'dalam_proses', 'dikirim_ke_provinsi', 'perlu_perbaikan', 'disetujui', 'ditolak'));

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['pegawai', 'users', 'pengajuan_kgb', 'notifikasi', 'email_logs'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Publication supabase_realtime tidak ditemukan; aktifkan Realtime secara manual.';
END $$;`;
    navigator.clipboard.writeText(migrationSql);
    setCopiedMigrationSql(true);
    setTimeout(() => setCopiedMigrationSql(false), 2500);
  };

  const handleSyncSeedToSupabase = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncResult({
        success: false,
        message: 'Harap simpan URL dan Anon Key Supabase terlebih dahulu.',
      });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const client = createClient(cleanUrl, cleanKey);

      // 1. Sync Pegawai
      const pegawaiPayload = allPegawai.map((p) => ({
        id: p.id,
        nama: p.nama,
        tempat_lahir: p.tempatLahir,
        tanggal_lahir: p.tanggalLahir,
        jabatan: p.jabatan,
        nip: p.nip,
        jenis_kelamin: p.jenisKelamin,
        bagian_divisi: p.bagianDivisi,
        no_hp: p.noHp,
        alamat_kantor: p.alamatKantor,
        alamat_rumah: p.alamatRumah,
        email: p.email,
        agama: p.agama,
        tanggal_pelantikan: p.tanggalPelantikan,
        jadwal_kgb_berikutnya: p.jadwalKgbBerikutnya,
        gaji_pokok_terakhir: p.gajiPokokTerakhir,
        golongan_pangkat: p.golonganPangkat,
        pangkat_terakhir: p.pangkatTerakhir,
      }));

      const { error: errPegawai } = await client.from('pegawai').upsert(pegawaiPayload);
      if (errPegawai) throw new Error(`Pegawai: ${errPegawai.message}`);

      // 2. Sync Users
      const usersPayload = allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        role: u.role,
        pegawai_id: u.pegawaiId || null,
        nama_lengkap: u.namaLengkap,
        email: u.email,
        status: u.status,
      }));
      const { error: errUsers } = await client.from('users').upsert(usersPayload);
      if (errUsers) throw new Error(`Users: ${errUsers.message}`);

      // 3. Sync Pengajuan
      const pengajuanPayload = allPengajuan.map((item) => ({
        id: item.id,
        no_pengajuan: item.noPengajuan,
        pegawai_id: item.pegawaiId,
        nama_pemohon: item.namaPemohon,
        nip_pemohon: item.nipPemohon,
        jabatan_pemohon: item.jabatanPemohon,
        divisi_pemohon: item.divisiPemohon,
        email_pemohon: item.emailPemohon,
        no_hp_pemohon: item.noHpPemohon,
        perihal: item.perihal,
        periode_kgb: item.periodeKgb,
        tmt_kgb_baru: item.tmtKgbBaru,
        gaji_lama: item.gajiLama,
        gaji_baru_estimasi: item.gajiBaruEstimasi,
        sk_pangkat_terakhir: item.skPangkatTerakhir,
        sk_gaji_berkala_terakhir: item.skGajiBerkalaTerakhir,
        dokumen_skp_prestasi: item.dokumenSkpPrestasi,
        dokumen_pendukung_lain: item.dokumenPendukungLain,
        catatan_pemohon: item.catatanPemohon,
        status: item.status,
        catatan_verifikator: item.catatanVerifikator,
        diverifikasi_oleh: item.diverifikasiOleh,
        tanggal_pengajuan: item.tanggalPengajuan,
        tanggal_verifikasi: item.tanggalVerifikasi,
        nomor_sk_kgb_diterbitkan: item.nomorSkKgbDiterbitkan,
        tanggal_sk_diterbitkan: item.tanggalSkDiterbitkan,
      }));
      const { error: errKgb } = await client.from('pengajuan_kgb').upsert(pengajuanPayload);
      if (errKgb) throw new Error(`Pengajuan: ${errKgb.message}`);

      setSyncResult({
        success: true,
        message: `Sukses! Berhasil menyinkronkan ${allPegawai.length} Pegawai, ${allUsers.length} User, dan ${allPengajuan.length} Pengajuan KGB ke Supabase.`,
      });
      onConfigChanged();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `Gagal sinkronisasi data: ${err.message}. Pastikan skema tabel sudah dijalankan di Supabase.`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Database Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan cloud PostgreSQL terpusat SI-KGB Bawaslu Subang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs text-slate-700">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 leading-relaxed text-emerald-900">
            <p className="font-semibold text-emerald-800">
              Arsitektur Hybrid Standar Industri:
            </p>
            <p className="mt-1">
              Aplikasi ini dilengkapi penyimpanan lokal terintegrasi yang selalu aktif dan responsif.
              Saat Anda memasukkan URL & Anon Key dari proyek Supabase Anda, aplikasi akan secara otomatis
              membaca dan menulis data ke tabel PostgreSQL Supabase secara langsung. Skrip skema
              mengaktifkan Realtime untuk tabel data utama agar perubahan dari perangkat lain langsung tampil.
            </p>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Dapat ditemukan pada Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Supabase Anon / Public Key
              </label>
              <textarea
                rows={2}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Dapat ditemukan pada Project Settings &gt; API &gt; Project API keys (anon public).
              </p>
            </div>
          </div>

          {/* Connection Test & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji Koneksi...' : 'Uji Koneksi'}</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Simpan Konfigurasi</span>
            </button>

            <button
              onClick={handleSyncSeedToSupabase}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              <UploadCloud className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menyinkronkan...' : 'Unggah Data Awal ke Supabase'}</span>
            </button>
          </div>

          {/* Test or Sync Result Alert */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3 ${
                testResult.success
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {syncResult && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3 ${
                syncResult.success
                  ? 'border border-sky-200 bg-sky-50 text-sky-900'
                  : 'border border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <div className="leading-relaxed">{syncResult.message}</div>
            </div>
          )}

          {/* SQL Schema Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Skema SQL Database Supabase</h4>
                <p className="text-[11px] text-slate-500">
                  Jalankan skrip ini sekali di Supabase SQL Editor untuk membuat tabel dan kebijakan RLS.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{showSqlPreview ? 'Sembunyikan' : 'Lihat Skrip'}</span>
                </button>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                >
                  {copiedSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showSqlPreview && (
              <pre className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[10px] text-slate-200">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            )}

            {/* Migrasi untuk database yang sudah berjalan */}
            <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">
                    Migrasi Database
                  </span>
                  <p className="text-xs font-bold text-indigo-950">
                    Perbarui Tabel Pegawai, Pengajuan, dan Realtime
                  </p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Jalankan SQL ini pada database yang sudah ada agar tanggal pegawai bersifat opsional, menambah kolom dokumen SK terbit, memperbarui status, dan mengaktifkan Realtime.
                  </p>
                </div>
                <button
                  onClick={handleCopyMigrationSql}
                  className="flex items-center gap-1 shrink-0 rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {copiedMigrationSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin SQL Migrasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
