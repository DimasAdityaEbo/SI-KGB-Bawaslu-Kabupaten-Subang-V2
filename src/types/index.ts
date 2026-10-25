export type UserRole = 'admin' | 'pegawai' | 'kasubag';

export type PengajuanStatus = 
  | 'menunggu_verifikasi' 
  | 'dalam_proses' 
  | 'dikirim_ke_provinsi'
  | 'perlu_perbaikan' 
  | 'disetujui' 
  | 'ditolak';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  pegawaiId?: string; // Link to Pegawai if role is pegawai
  namaLengkap: string;
  email: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
  lastLogin?: string;
}

export interface Pegawai {
  id: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jabatan: string;
  nip: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  bagianDivisi: string;
  noHp: string;
  alamatKantor: string;
  alamatRumah: string;
  email: string;
  agama: string;
  tanggalPelantikan: string;
  jadwalKgbBerikutnya: string; // YYYY-MM-DD
  gajiPokokTerakhir?: number;
  golonganPangkat?: string;
  pangkatTerakhir?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DokumenLampiran {
  id: string;
  namaFile: string;
  jenisDokumen: 'sk_pangkat' | 'sk_kgb' | 'skp_prestasi' | 'dokumen_pendukung';
  tipeFile: string;
  ukuranFile: string;
  fileData?: string; // Base64 or URL
  uploadedAt: string;
}

export interface PengajuanKGB {
  id: string;
  noPengajuan: string; // e.g. KGB/BWS-SBG/2026/001
  pegawaiId: string;
  namaPemohon: string;
  nipPemohon: string;
  jabatanPemohon: string;
  divisiPemohon: string;
  emailPemohon: string;
  noHpPemohon: string;
  perihal: string;
  periodeKgb: string;
  tmtKgbBaru: string;
  gajiLama?: number;
  gajiBaruEstimasi?: number;
  skPangkatTerakhir: DokumenLampiran;
  skGajiBerkalaTerakhir?: DokumenLampiran;
  dokumenSkpPrestasi: DokumenLampiran;
  dokumenPendukungLain?: DokumenLampiran;
  catatanPemohon?: string;
  status: PengajuanStatus;
  catatanVerifikator?: string;
  diverifikasiOleh?: string;
  tanggalPengajuan: string;
  tanggalVerifikasi?: string;
  nomorSkKgbDiterbitkan?: string;
  tanggalSkDiterbitkan?: string;
  dokumenSkKgbDiterbitkan?: DokumenLampiran;
}

export interface NotificationItem {
  id: string;
  userId?: string; // specific user or 'all_admin'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  linkTarget?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailDispatchLog {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  contentSnippet: string;
  status: 'sent' | 'delivered' | 'failed';
  pengajuanId?: string;
  noPengajuan?: string;
  timestamp: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type TemplateKategori = 
  | 'surat_pengantar' 
  | 'sk_kgb' 
  | 'disposisi' 
  | 'tanda_terima' 
  | 'surat_keterangan' 
  | 'lainnya';

export interface TemplateDokumen {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: TemplateKategori;
  formatNomor: string;
  judulDokumen: string;
  isiKonten: string;
  penandatanganNama: string;
  penandatanganJabatan: string;
  penandatanganNip: string;
  tembusan?: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface KopSuratConfig {
  namaInstansiUtama: string;
  namaInstansiSub: string;
  unitKerja?: string;
  alamatLengkap: string;
  teleponFaks?: string;
  emailWebsite?: string;
  kodePos?: string;
  logoUrl?: string; // Base64 data URL or external URL
  logoWidthPx?: number; // e.g. 70 - 120
  garisKopGaya?: 'ganda' | 'tunggal' | 'tebal';
  updatedAt?: string;
}

export interface PejabatSignatureDetail {
  nama: string;
  jabatan: string;
  nip: string;
  tandaTanganUrl?: string; // Base64 data URL
  tandaTanganWidthPx?: number; // 90 to 220
  tampilkanTandaTangan: boolean;
}

export interface TandaTanganCapConfig {
  // Pimpinan (Kepala Sekretariat / Ketua Bawaslu)
  namaPejabat: string;
  jabatan: string;
  nip: string;
  kota: string;
  tanggalText?: string;
  // Tanda Tangan Pimpinan
  tandaTanganUrl?: string; // Base64 data URL
  tandaTanganWidthPx?: number; // 90 to 220
  tampilkanTandaTangan: boolean;
  // Cap / Stempel Resmi
  capUrl?: string; // Base64 data URL
  capWidthPx?: number; // 80 to 200
  tampilkanCap: boolean;
  // Tata Letak & Efek Cap
  posisiCap: 'tumpang_kiri' | 'sebelah_kiri' | 'sebelah_kanan';
  opacityCap?: number; // 0.5 to 1.0

  // Tanda Tangan Admin (Kasubag Administrasi)
  adminKasubag?: PejabatSignatureDetail;

  // Format Tampilan pada Cetak Dokumen:
  // 'dua_pejabat': Menampilkan Kasubag Administrasi (kiri) & Pimpinan + Cap (kanan)
  // 'pimpinan_saja': Hanya Pimpinan (kanan)
  // 'admin_saja': Hanya Kasubag Administrasi (kanan)
  modeTampilanDokumen?: 'dua_pejabat' | 'pimpinan_saja' | 'admin_saja';

  updatedAt?: string;
}

