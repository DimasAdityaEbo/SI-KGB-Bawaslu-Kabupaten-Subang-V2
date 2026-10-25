import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pegawai, PengajuanKGB, User, NotificationItem, EmailDispatchLog, SupabaseConfig } from '../types';

const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'sikgb_supabase_config',
  PEGAWAI: 'sikgb_pegawai_data',
  PENGAJUAN: 'sikgb_pengajuan_data',
  USERS: 'sikgb_users_data',
  NOTIFICATIONS: 'sikgb_notif_data',
  EMAIL_LOGS: 'sikgb_email_logs_data',
};

// Default Supabase config (check env vars first, then localStorage, then default project)
export const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://aioggloplrzychyalxvy.supabase.co',
  anonKey: 'sb_publishable_g0ZnvLF42Q8IVTaI_9WHZg_HvhX0VfW',
};

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip /rest/v1 if included by user copy-paste
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  return cleaned;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = normalizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL || '');
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const url = normalizeSupabaseUrl(parsed.url || envUrl || DEFAULT_SUPABASE_CONFIG.url);
      const anonKey = parsed.anonKey || envKey || DEFAULT_SUPABASE_CONFIG.anonKey;
      return {
        url,
        anonKey,
        isConnected: Boolean(url && anonKey),
      };
    }
  } catch (e) {
    console.error('Error reading saved Supabase config:', e);
  }

  const url = normalizeSupabaseUrl(envUrl || DEFAULT_SUPABASE_CONFIG.url);
  const anonKey = envKey || DEFAULT_SUPABASE_CONFIG.anonKey;

  return {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const normalizedUrl = normalizeSupabaseUrl(url);
  try {
    localStorage.setItem(
      STORAGE_KEYS.SUPABASE_CONFIG,
      JSON.stringify({
        url: normalizedUrl,
        anonKey: anonKey.trim(),
        isConnected: Boolean(normalizedUrl && anonKey.trim()),
      })
    );
  } catch (e) {
    console.error('Failed to save Supabase config to local storage', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let supabaseInstanceConfig: { url: string; anonKey: string } | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (
    !supabaseInstanceConfig ||
    supabaseInstanceConfig.url !== config.url ||
    supabaseInstanceConfig.anonKey !== config.anonKey
  ) {
    supabaseInstance = null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
      supabaseInstanceConfig = { url: config.url, anonKey: config.anonKey };
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
  supabaseInstanceConfig = null;
}

export function subscribeToSupabaseChanges(onChange: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;

  const channel = supabase.channel('sikgb-data-sync');
  for (const table of ['pegawai', 'users', 'pengajuan_kgb', 'notifikasi', 'email_logs']) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      onChange
    );
  }

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error(`Supabase realtime subscription failed: ${status}`);
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

// SQL Schema for Supabase Setup
export const SUPABASE_SQL_SCHEMA = `-- =================================================================
-- SKEMA DATABASE SI-KGB BAWASLU KABUPATEN SUBANG (SUPABASE POSTGRES)
-- =================================================================

-- 1. Tabel Pegawai
CREATE TABLE IF NOT EXISTS public.pegawai (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir DATE,
  jabatan TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  bagian_divisi TEXT NOT NULL,
  no_hp TEXT NOT NULL,
  alamat_kantor TEXT NOT NULL,
  alamat_rumah TEXT NOT NULL,
  email TEXT NOT NULL,
  agama TEXT NOT NULL,
  tanggal_pelantikan DATE,
  jadwal_kgb_berikutnya DATE,
  gaji_pokok_terakhir NUMERIC DEFAULT 0,
  golongan_pangkat TEXT,
  pangkat_terakhir TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Users (Kredensial Login Pegawai, Kasubag & Admin)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pegawai', 'kasubag')),
  pegawai_id TEXT REFERENCES public.pegawai(id) ON DELETE SET NULL,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pengajuan KGB
CREATE TABLE IF NOT EXISTS public.pengajuan_kgb (
  id TEXT PRIMARY KEY,
  no_pengajuan TEXT UNIQUE NOT NULL,
  pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  nama_pemohon TEXT NOT NULL,
  nip_pemohon TEXT NOT NULL,
  jabatan_pemohon TEXT NOT NULL,
  divisi_pemohon TEXT NOT NULL,
  email_pemohon TEXT NOT NULL,
  no_hp_pemohon TEXT NOT NULL,
  perihal TEXT NOT NULL,
  periode_kgb TEXT NOT NULL,
  tmt_kgb_baru DATE NOT NULL,
  gaji_lama NUMERIC,
  gaji_baru_estimasi NUMERIC,
  sk_pangkat_terakhir JSONB NOT NULL,
  sk_gaji_berkala_terakhir JSONB,
  dokumen_skp_prestasi JSONB NOT NULL,
  dokumen_pendukung_lain JSONB,
  catatan_pemohon TEXT,
  status TEXT NOT NULL DEFAULT 'menunggu_verifikasi' CHECK (
    status IN ('menunggu_verifikasi', 'dalam_proses', 'dikirim_ke_provinsi', 'perlu_perbaikan', 'disetujui', 'ditolak')
  ),
  catatan_verifikator TEXT,
  diverifikasi_oleh TEXT,
  tanggal_pengajuan TIMESTAMPTZ DEFAULT NOW(),
  tanggal_verifikasi TIMESTAMPTZ,
  nomor_sk_kgb_diterbitkan TEXT,
  tanggal_sk_diterbitkan DATE,
  dokumen_sk_kgb_diterbitkan JSONB
);

-- 4. Tabel Notifikasi
CREATE TABLE IF NOT EXISTS public.notifikasi (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Log Pengiriman Email
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_snippet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('sent', 'delivered', 'failed')),
  pengajuan_id TEXT,
  no_pengajuan TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Pengaturan Kop Surat Resmi
CREATE TABLE IF NOT EXISTS public.pengaturan_kop_surat (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nama_instansi_utama TEXT NOT NULL,
  nama_instansi_sub TEXT NOT NULL,
  unit_kerja TEXT,
  alamat_lengkap TEXT NOT NULL,
  telepon_faks TEXT,
  email_website TEXT,
  kode_pos TEXT,
  logo_url TEXT,
  logo_width_px INTEGER DEFAULT 80,
  garis_kop_gaya TEXT DEFAULT 'ganda',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Pengaturan Tanda Tangan & Cap Dinas
CREATE TABLE IF NOT EXISTS public.pengaturan_ttd_cap (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nama_pejabat TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  nip TEXT NOT NULL,
  kota TEXT NOT NULL,
  tanda_tangan_url TEXT,
  tanda_tangan_width_px INTEGER DEFAULT 140,
  tampilkan_tanda_tangan BOOLEAN DEFAULT TRUE,
  cap_url TEXT,
  cap_width_px INTEGER DEFAULT 120,
  tampilkan_cap BOOLEAN DEFAULT TRUE,
  posisi_cap TEXT DEFAULT 'tumpang_kiri',
  opacity_cap NUMERIC DEFAULT 0.88,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Template Dokumen
CREATE TABLE IF NOT EXISTS public.template_dokumen (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  nomor_perbawaslu TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  isi_template TEXT NOT NULL,
  variabel_tersedia JSONB NOT NULL,
  terakhir_diubah TIMESTAMPTZ DEFAULT NOW(),
  diubah_oleh TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses Publik Terbuka untuk API Key
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_kgb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_kop_surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_ttd_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_dokumen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses anon penuh pegawai" ON public.pegawai;
CREATE POLICY "Akses anon penuh pegawai" ON public.pegawai FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh users" ON public.users;
CREATE POLICY "Akses anon penuh users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh pengajuan" ON public.pengajuan_kgb;
CREATE POLICY "Akses anon penuh pengajuan" ON public.pengajuan_kgb FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh notifikasi" ON public.notifikasi;
CREATE POLICY "Akses anon penuh notifikasi" ON public.notifikasi FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh email_logs" ON public.email_logs;
CREATE POLICY "Akses anon penuh email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh kop_surat" ON public.pengaturan_kop_surat;
CREATE POLICY "Akses anon penuh kop_surat" ON public.pengaturan_kop_surat FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh ttd_cap" ON public.pengaturan_ttd_cap;
CREATE POLICY "Akses anon penuh ttd_cap" ON public.pengaturan_ttd_cap FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses anon penuh templates" ON public.template_dokumen;
CREATE POLICY "Akses anon penuh templates" ON public.template_dokumen FOR ALL USING (true) WITH CHECK (true);

-- Aktifkan sinkronisasi realtime untuk tabel data utama
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
END $$;

-- Penyesuaian kolom & constraint jika tabel sudah ada sebelumnya
ALTER TABLE public.pegawai
  ALTER COLUMN tanggal_lahir DROP NOT NULL,
  ALTER COLUMN tanggal_pelantikan DROP NOT NULL,
  ALTER COLUMN jadwal_kgb_berikutnya DROP NOT NULL;
ALTER TABLE public.pengajuan_kgb
  ADD COLUMN IF NOT EXISTS dokumen_sk_kgb_diterbitkan JSONB;
ALTER TABLE public.pengajuan_kgb DROP CONSTRAINT IF EXISTS pengajuan_kgb_status_check;
ALTER TABLE public.pengajuan_kgb ADD CONSTRAINT pengajuan_kgb_status_check 
  CHECK (status IN ('menunggu_verifikasi', 'dalam_proses', 'dikirim_ke_provinsi', 'perlu_perbaikan', 'disetujui', 'ditolak'));
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'pegawai', 'kasubag'));

-- =================================================================
-- SEED DATA AWAL: PEGAWAI & AKUN USER
-- =================================================================

-- 1. Seed Data Pegawai
INSERT INTO public.pegawai (
  id, nama, tempat_lahir, tanggal_lahir, jabatan, nip, jenis_kelamin, bagian_divisi,
  no_hp, alamat_kantor, alamat_rumah, email, agama, tanggal_pelantikan,
  jadwal_kgb_berikutnya, gaji_pokok_terakhir, golongan_pangkat, pangkat_terakhir
) VALUES
  ('peg-001', 'Dimas Ebo Kurniawan, S.IP', 'Subang', '1992-06-14', 'Analis Kepegawaian Pertama', '199206142019031004', 'Laki-laki', 'Sekretariat / Sub Bagian Administrasi', '081223456789', 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211', 'Perumahan Griya Pasirkareumbi Blok B4 No. 12, Subang', 'dimas.ebo012@gmail.com', 'Islam', '2020-03-01', '2026-10-20', 3820000, 'Penata Muda / III/a', 'Penata Muda Tk. I'),
  ('peg-002', 'Siti Rahmawati, S.H.', 'Bandung', '1990-11-28', 'Penyusun Bahan Bantuan Hukum', '199011282018012003', 'Perempuan', 'Divisi Hukum dan Penyelesaian Sengketa', '085311223344', 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211', 'Jl. Ahmad Yani No. 45, Karanganyar, Subang', 'siti.rahmawati@bawaslu-subang.go.id', 'Islam', '2019-01-15', '2026-10-28', 4150000, 'Penata / III/c', 'Penata'),
  ('peg-003', 'Ahmad Fauzi, S.Kom', 'Subang', '1994-03-05', 'Pranata Komputer Pelaksana', '199403052021021002', 'Laki-laki', 'Divisi Penanganan Pelanggaran dan Datin', '087822998811', 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211', 'Jl. Otista No. 89, Sukamelang, Subang', 'ahmad.fauzi@bawaslu-subang.go.id', 'Islam', '2021-04-01', '2026-11-02', 3200000, 'Pengatur / II/c', 'Pengatur'),
  ('peg-004', 'Rian Kurniawan, S.AP', 'Purwakarta', '1988-08-17', 'Pengelola Pengawasan Pemilu', '198808172017041001', 'Laki-laki', 'Divisi Pencegahan, Partisipasi Masyarakat, dan Hubungan Masyarakat', '081399887766', 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211', 'Komplek Ciheuleut Permai No. 15, Subang', 'rian.kurniawan@bawaslu-subang.go.id', 'Islam', '2017-05-02', '2027-02-15', 4450000, 'Penata Tingkat I / III/d', 'Penata Tk. I'),
  ('peg-005', 'Dewi Lestari, S.E.', 'Majalengka', '1995-12-09', 'Bendahara Pengeluaran Pembantu', '199512092022032005', 'Perempuan', 'Divisi Sumber Daya Manusia, Organisasi, dan Diklat', '082155667788', 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211', 'Jl. Mayjen Sutoyo No. 34, Subang', 'dewi.lestari@bawaslu-subang.go.id', 'Islam', '2022-04-01', '2027-04-01', 3100000, 'Penata Muda / III/a', 'Penata Muda')
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  nip = EXCLUDED.nip,
  jabatan = EXCLUDED.jabatan,
  bagian_divisi = EXCLUDED.bagian_divisi,
  email = EXCLUDED.email;

-- 2. Seed Data Akun User (Admin, Kasubag & Pegawai)
INSERT INTO public.users (
  id, username, password, role, pegawai_id, nama_lengkap, email, status
) VALUES
  -- Akun Admin Sistem
  ('usr-admin', 'admin', 'admin123', 'admin', NULL, 'Administrator Sistem Bawaslu Subang', 'admin@bawaslu-subang.go.id', 'aktif'),
  -- Akun Kasubag Administrasi
  ('usr-kasubag', 'kasubag', 'kasubag123', 'kasubag', NULL, 'Kepala Sub Bagian Administrasi Bawaslu Subang', 'kasubag@bawaslu-subang.go.id', 'aktif'),
  -- Akun Pegawai (Password default: NIP masing-masing)
  ('usr-dimas', 'dimas', '199206142019031004', 'pegawai', 'peg-001', 'Dimas Ebo Kurniawan, S.IP', 'dimas.ebo012@gmail.com', 'aktif'),
  ('usr-siti', 'siti', '199011282018012003', 'pegawai', 'peg-002', 'Siti Rahmawati, S.H.', 'siti.rahmawati@bawaslu-subang.go.id', 'aktif'),
  ('usr-ahmad', 'ahmad', '199403052021021002', 'pegawai', 'peg-003', 'Ahmad Fauzi, S.Kom', 'ahmad.fauzi@bawaslu-subang.go.id', 'aktif'),
  ('usr-rian', 'rian', '198808172017041001', 'pegawai', 'peg-004', 'Rian Kurniawan, S.AP', 'rian.kurniawan@bawaslu-subang.go.id', 'aktif'),
  ('usr-dewi', 'dewi', '199512092022032005', 'pegawai', 'peg-005', 'Dewi Lestari, S.E.', 'dewi.lestari@bawaslu-subang.go.id', 'aktif')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  pegawai_id = EXCLUDED.pegawai_id,
  nama_lengkap = EXCLUDED.nama_lengkap,
  email = EXCLUDED.email,
  status = EXCLUDED.status;

-- 3. Seed Pengaturan Kop Surat Resmi
INSERT INTO public.pengaturan_kop_surat (
  id, nama_instansi_utama, nama_instansi_sub, unit_kerja, alamat_lengkap, telepon_faks, email_website, kode_pos, logo_url, logo_width_px, garis_kop_gaya
) VALUES (
  'default',
  'BADAN PENGAWAS PEMILIHAN UMUM',
  'KABUPATEN SUBANG',
  'SEKRETARIAT',
  'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat',
  'Telp. (0260) 412345',
  'set.subang@bawaslu.go.id / subang.bawaslu.go.id',
  '41211',
  '/logo-bawaslu.png',
  80,
  'ganda'
) ON CONFLICT (id) DO NOTHING;

-- 4. Seed Pengaturan Tanda Tangan & Cap Dinas
INSERT INTO public.pengaturan_ttd_cap (
  id, nama_pejabat, jabatan, nip, kota, tampilkan_tanda_tangan, tampilkan_cap, posisi_cap, opacity_cap
) VALUES (
  'default',
  'H. TATANG KOSWARA, S.Sos., M.Si',
  'Kepala Sekretariat Bawaslu Kabupaten Subang',
  '197405121998031002',
  'Subang',
  TRUE,
  TRUE,
  'tumpang_kiri',
  0.88
) ON CONFLICT (id) DO NOTHING;
`;
