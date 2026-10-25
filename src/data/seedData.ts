import { Pegawai, User, PengajuanKGB, NotificationItem, EmailDispatchLog, TemplateDokumen } from '../types';

export const INITIAL_PEGAWAI: Pegawai[] = [
  {
    id: 'peg-001',
    nama: 'Dimas Ebo Kurniawan, S.IP',
    tempatLahir: 'Subang',
    tanggalLahir: '1992-06-14',
    jabatan: 'Analis Kepegawaian Pertama',
    nip: '199206142019031004',
    jenisKelamin: 'Laki-laki',
    bagianDivisi: 'Sekretariat / Sub Bagian Administrasi',
    noHp: '081223456789',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: 'Perumahan Griya Pasirkareumbi Blok B4 No. 12, Subang',
    email: 'dimas.ebo012@gmail.com',
    agama: 'Islam',
    tanggalPelantikan: '2020-03-01',
    jadwalKgbBerikutnya: '2026-10-20', // Terdekat < 1 bulan! (Today is 2026-10-04)
    gajiPokokTerakhir: 3820000,
    golonganPangkat: 'Penata Muda / III/a',
    pangkatTerakhir: 'Penata Muda Tk. I',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'peg-002',
    nama: 'Siti Rahmawati, S.H.',
    tempatLahir: 'Bandung',
    tanggalLahir: '1990-11-28',
    jabatan: 'Penyusun Bahan Bantuan Hukum',
    nip: '199011282018012003',
    jenisKelamin: 'Perempuan',
    bagianDivisi: 'Divisi Hukum dan Penyelesaian Sengketa',
    noHp: '085311223344',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: 'Jl. Ahmad Yani No. 45, Karanganyar, Subang',
    email: 'siti.rahmawati@bawaslu-subang.go.id',
    agama: 'Islam',
    tanggalPelantikan: '2019-01-15',
    jadwalKgbBerikutnya: '2026-10-28', // Terdekat < 1 bulan!
    gajiPokokTerakhir: 4150000,
    golonganPangkat: 'Penata / III/c',
    pangkatTerakhir: 'Penata',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'peg-003',
    nama: 'Ahmad Fauzi, S.Kom',
    tempatLahir: 'Subang',
    tanggalLahir: '1994-03-05',
    jabatan: 'Pranata Komputer Pelaksana',
    nip: '199403052021021002',
    jenisKelamin: 'Laki-laki',
    bagianDivisi: 'Divisi Penanganan Pelanggaran dan Datin',
    noHp: '087822998811',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: 'Jl. Otista No. 89, Sukamelang, Subang',
    email: 'ahmad.fauzi@bawaslu-subang.go.id',
    agama: 'Islam',
    tanggalPelantikan: '2021-04-01',
    jadwalKgbBerikutnya: '2026-11-02', // Terdekat < 1 bulan (kurang dari 30 hari)
    gajiPokokTerakhir: 3200000,
    golonganPangkat: 'Pengatur / II/c',
    pangkatTerakhir: 'Pengatur',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'peg-004',
    nama: 'Rian Kurniawan, S.AP',
    tempatLahir: 'Purwakarta',
    tanggalLahir: '1988-08-17',
    jabatan: 'Pengelola Pengawasan Pemilu',
    nip: '198808172017041001',
    jenisKelamin: 'Laki-laki',
    bagianDivisi: 'Divisi Pencegahan, Partisipasi Masyarakat, dan Hubungan Masyarakat',
    noHp: '081399887766',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: 'Komplek Ciheuleut Permai No. 15, Subang',
    email: 'rian.kurniawan@bawaslu-subang.go.id',
    agama: 'Islam',
    tanggalPelantikan: '2017-05-02',
    jadwalKgbBerikutnya: '2027-02-15', // Masih lama (> 1 bulan)
    gajiPokokTerakhir: 4450000,
    golonganPangkat: 'Penata Tingkat I / III/d',
    pangkatTerakhir: 'Penata Tk. I',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'peg-005',
    nama: 'Dewi Lestari, S.E.',
    tempatLahir: 'Majalengka',
    tanggalLahir: '1995-12-09',
    jabatan: 'Bendahara Pengeluaran Pembantu',
    nip: '199512092022032005',
    jenisKelamin: 'Perempuan',
    bagianDivisi: 'Divisi Sumber Daya Manusia, Organisasi, dan Diklat',
    noHp: '082155667788',
    alamatKantor: 'Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    alamatRumah: 'Jl. Mayjen Sutoyo No. 34, Subang',
    email: 'dewi.lestari@bawaslu-subang.go.id',
    agama: 'Islam',
    tanggalPelantikan: '2022-04-01',
    jadwalKgbBerikutnya: '2027-04-01',
    gajiPokokTerakhir: 3100000,
    golonganPangkat: 'Penata Muda / III/a',
    pangkatTerakhir: 'Penata Muda',
    createdAt: '2024-01-10T08:00:00Z',
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    namaLengkap: 'Administrator Sistem Bawaslu Subang',
    email: 'admin@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-10-04T23:30:00Z'
  },
  {
    id: 'usr-kasubag',
    username: 'kasubag',
    password: 'kasubag123',
    role: 'kasubag',
    namaLengkap: 'Kepala Sub Bagian Administrasi Bawaslu Subang',
    email: 'kasubag@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-10-04T22:00:00Z'
  },
  {
    id: 'usr-dimas',
    username: 'dimas',
    password: '199206142019031004', // NIP default
    role: 'pegawai',
    pegawaiId: 'peg-001',
    namaLengkap: 'Dimas Ebo Kurniawan, S.IP',
    email: 'dimas.ebo012@gmail.com',
    status: 'aktif',
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2026-10-04T20:15:00Z'
  },
  {
    id: 'usr-siti',
    username: 'siti',
    password: '199011282018012003', // NIP default
    role: 'pegawai',
    pegawaiId: 'peg-002',
    namaLengkap: 'Siti Rahmawati, S.H.',
    email: 'siti.rahmawati@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2026-10-03T11:20:00Z'
  },
  {
    id: 'usr-ahmad',
    username: 'ahmad',
    password: '199403052021021002', // NIP default
    role: 'pegawai',
    pegawaiId: 'peg-003',
    namaLengkap: 'Ahmad Fauzi, S.Kom',
    email: 'ahmad.fauzi@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'usr-rian',
    username: 'rian',
    password: '198808172017041001', // NIP default
    role: 'pegawai',
    pegawaiId: 'peg-004',
    namaLengkap: 'Rian Kurniawan, S.AP',
    email: 'rian.kurniawan@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'usr-dewi',
    username: 'dewi',
    password: '199512092022032005', // NIP default
    role: 'pegawai',
    pegawaiId: 'peg-005',
    namaLengkap: 'Dewi Lestari, S.E.',
    email: 'dewi.lestari@bawaslu-subang.go.id',
    status: 'aktif',
    createdAt: '2024-01-05T00:00:00Z'
  }
];

export const INITIAL_PENGAJUAN: PengajuanKGB[] = [
  {
    id: 'kgb-2026-001',
    noPengajuan: 'KGB/BWS-SBG/2026/001',
    pegawaiId: 'peg-001',
    namaPemohon: 'Dimas Ebo Kurniawan, S.IP',
    nipPemohon: '199206142019031004',
    jabatanPemohon: 'Analis Kepegawaian Pertama',
    divisiPemohon: 'Sekretariat / Sub Bagian Administrasi',
    emailPemohon: 'dimas.ebo012@gmail.com',
    noHpPemohon: '081223456789',
    perihal: 'Permohonan Kenaikan Gaji Berkala (KGB) Periode Oktober 2026',
    periodeKgb: 'Oktober 2026',
    tmtKgbBaru: '2026-10-01',
    gajiLama: 3820000,
    gajiBaruEstimasi: 3980000,
    skPangkatTerakhir: {
      id: 'doc-001',
      namaFile: 'SK_Pangkat_Terakhir_Dimas_Ebo.pdf',
      jenisDokumen: 'sk_pangkat',
      tipeFile: 'application/pdf',
      ukuranFile: '1.4 MB',
      uploadedAt: '2026-10-02T09:15:00Z'
    },
    skGajiBerkalaTerakhir: {
      id: 'doc-002',
      namaFile: 'SK_KGB_Terakhir_2024_Dimas.pdf',
      jenisDokumen: 'sk_kgb',
      tipeFile: 'application/pdf',
      ukuranFile: '980 KB',
      uploadedAt: '2026-10-02T09:16:00Z'
    },
    dokumenSkpPrestasi: {
      id: 'doc-003',
      namaFile: 'Penilaian_Prestasi_Kerja_SKP_2025.pdf',
      jenisDokumen: 'skp_prestasi',
      tipeFile: 'application/pdf',
      ukuranFile: '2.1 MB',
      uploadedAt: '2026-10-02T09:17:00Z'
    },
    catatanPemohon: 'Mohon dapat diproses kenaikan gaji berkala sesuai masa kerja golongan 2 tahun. Berkas lengkap dan telah divalidasi.',
    status: 'menunggu_verifikasi',
    tanggalPengajuan: '2026-10-02T09:20:00Z'
  },
  {
    id: 'kgb-2026-002',
    noPengajuan: 'KGB/BWS-SBG/2026/002',
    pegawaiId: 'peg-002',
    namaPemohon: 'Siti Rahmawati, S.H.',
    nipPemohon: '199011282018012003',
    jabatanPemohon: 'Penyusun Bahan Bantuan Hukum',
    divisiPemohon: 'Divisi Hukum dan Penyelesaian Sengketa',
    emailPemohon: 'siti.rahmawati@bawaslu-subang.go.id',
    noHpPemohon: '085311223344',
    perihal: 'Pengajuan Kenaikan Gaji Berkala (KGB) TMT Oktober 2026',
    periodeKgb: 'Oktober 2026',
    tmtKgbBaru: '2026-10-01',
    gajiLama: 4150000,
    gajiBaruEstimasi: 4320000,
    skPangkatTerakhir: {
      id: 'doc-004',
      namaFile: 'SK_Kenaikan_Pangkat_Siti_Rahmawati.pdf',
      jenisDokumen: 'sk_pangkat',
      tipeFile: 'application/pdf',
      ukuranFile: '1.2 MB',
      uploadedAt: '2026-09-28T14:10:00Z'
    },
    dokumenSkpPrestasi: {
      id: 'doc-005',
      namaFile: 'SKP_Tahun_2025_Nilai_Baik_Siti.pdf',
      jenisDokumen: 'skp_prestasi',
      tipeFile: 'application/pdf',
      ukuranFile: '1.8 MB',
      uploadedAt: '2026-09-28T14:11:00Z'
    },
    status: 'disetujui',
    diverifikasiOleh: 'Administrator Kepegawaian',
    catatanVerifikator: 'Berkas telah memenuhi syarat administratif dan substantif (SKP Sangat Baik, Masa Kerja Golongan memenuhi syarat). Surat Rekomendasi KGB telah diterbitkan.',
    nomorSkKgbDiterbitkan: '045.2/KP.04.00/JB-22/10/2026',
    tanggalPengajuan: '2026-09-28T14:15:00Z',
    tanggalVerifikasi: '2026-09-30T10:00:00Z',
    tanggalSkDiterbitkan: '2026-09-30'
  },
  {
    id: 'kgb-2026-003',
    noPengajuan: 'KGB/BWS-SBG/2026/003',
    pegawaiId: 'peg-003',
    namaPemohon: 'Ahmad Fauzi, S.Kom',
    nipPemohon: '199403052021021002',
    jabatanPemohon: 'Pranata Komputer Pelaksana',
    divisiPemohon: 'Divisi Penanganan Pelanggaran dan Datin',
    emailPemohon: 'ahmad.fauzi@bawaslu-subang.go.id',
    noHpPemohon: '087822998811',
    perihal: 'Pengajuan KGB Periode November 2026',
    periodeKgb: 'November 2026',
    tmtKgbBaru: '2026-11-01',
    gajiLama: 3200000,
    gajiBaruEstimasi: 3350000,
    skPangkatTerakhir: {
      id: 'doc-006',
      namaFile: 'SK_Pangkat_Ahmad_Fauzi.pdf',
      jenisDokumen: 'sk_pangkat',
      tipeFile: 'application/pdf',
      ukuranFile: '1.1 MB',
      uploadedAt: '2026-10-01T11:00:00Z'
    },
    dokumenSkpPrestasi: {
      id: 'doc-007',
      namaFile: 'Lembar_SKP_Draft_Fauzi.pdf',
      jenisDokumen: 'skp_prestasi',
      tipeFile: 'application/pdf',
      ukuranFile: '850 KB',
      uploadedAt: '2026-10-01T11:02:00Z'
    },
    catatanPemohon: 'Pengajuan kenaikan gaji berkala 2 tahun.',
    status: 'perlu_perbaikan',
    diverifikasiOleh: 'Administrator Kepegawaian',
    catatanVerifikator: 'Mohon lampirkan lembar SKP tahun 2025 yang telah ditandatangani basah/barcode resmi oleh Pejabat Penilai Kinerja (Koordinator Divisi). Dokumen yang dilampirkan masih berstatus draft.',
    tanggalPengajuan: '2026-10-01T11:10:00Z',
    tanggalVerifikasi: '2026-10-03T16:20:00Z'
  },
  {
    id: 'kgb-2026-004',
    noPengajuan: 'KGB/BWS-SBG/2026/004',
    pegawaiId: 'peg-004',
    namaPemohon: 'Rian Kurniawan, S.AP',
    nipPemohon: '198808172017041001',
    jabatanPemohon: 'Pengelola Pengawasan Pemilu',
    divisiPemohon: 'Divisi Pencegahan, Partisipasi Masyarakat, dan Hubungan Masyarakat',
    emailPemohon: 'rian.kurniawan@bawaslu-subang.go.id',
    noHpPemohon: '081399887766',
    perihal: 'Pengajuan KGB Periode Mei 2026',
    periodeKgb: 'Mei 2026',
    tmtKgbBaru: '2026-05-01',
    gajiLama: 4450000,
    gajiBaruEstimasi: 4620000,
    skPangkatTerakhir: {
      id: 'doc-008',
      namaFile: 'SK_Pangkat_Rian_Kurniawan.pdf',
      jenisDokumen: 'sk_pangkat',
      tipeFile: 'application/pdf',
      ukuranFile: '1.5 MB',
      uploadedAt: '2026-05-02T08:00:00Z'
    },
    dokumenSkpPrestasi: {
      id: 'doc-009',
      namaFile: 'SKP_Rian_2025.pdf',
      jenisDokumen: 'skp_prestasi',
      tipeFile: 'application/pdf',
      ukuranFile: '2.0 MB',
      uploadedAt: '2026-05-02T08:05:00Z'
    },
    status: 'disetujui',
    diverifikasiOleh: 'Administrator Kepegawaian',
    catatanVerifikator: 'Pemberitahuan KGB telah diterbitkan dan diserahkan ke bagian perbendaharaan.',
    nomorSkKgbDiterbitkan: '018.1/KP.04.00/JB-22/05/2026',
    tanggalPengajuan: '2026-05-02T08:10:00Z',
    tanggalVerifikasi: '2026-05-05T09:30:00Z',
    tanggalSkDiterbitkan: '2026-05-05'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Pengajuan KGB Baru Masuk',
    message: 'Permohonan KGB atas nama Dimas Ebo Kurniawan, S.IP (No: KGB/BWS-SBG/2026/001) menunggu verifikasi Anda.',
    type: 'info',
    isRead: false,
    createdAt: '2026-10-02T09:20:00Z'
  },
  {
    id: 'notif-2',
    userId: 'usr-dimas',
    title: 'Pengingat Jadwal KGB Terdekat',
    message: 'Jadwal kenaikan gaji berkala Anda diperkirakan jatuh pada 20 Oktober 2026 (< 16 hari lagi). Segera lengkapi berkas jika belum!',
    type: 'warning',
    isRead: false,
    createdAt: '2026-10-04T08:00:00Z'
  },
  {
    id: 'notif-3',
    userId: 'usr-siti',
    title: 'Pengajuan KGB Disetujui',
    message: 'Selamat! Permohonan KGB No. KGB/BWS-SBG/2026/002 telah Disetujui. Surat Pemberitahuan KGB Nomor 045.2/KP.04.00/JB-22/10/2026 siap diunduh.',
    type: 'success',
    isRead: true,
    createdAt: '2026-09-30T10:05:00Z'
  },
  {
    id: 'notif-4',
    userId: 'usr-ahmad',
    title: 'Permintaan Perbaikan Berkas KGB',
    message: 'Pengajuan No. KGB/BWS-SBG/2026/003 memerlukan perbaikan berkas SKP legalisir. Silakan periksa catatan verifikator.',
    type: 'alert',
    isRead: false,
    createdAt: '2026-10-03T16:22:00Z'
  }
];

export const INITIAL_EMAIL_LOGS: EmailDispatchLog[] = [
  {
    id: 'elog-1',
    toEmail: 'dimas.ebo012@gmail.com',
    toName: 'Dimas Ebo Kurniawan, S.IP',
    subject: '[Bawaslu Subang] Konfirmasi Penerimaan Pengajuan KGB - KGB/BWS-SBG/2026/001',
    contentSnippet: 'Permohonan KGB Anda telah diterima di sistem SI-KGB Bawaslu Kabupaten Subang. Tim Kepegawaian akan memverifikasi berkas dalam 3-5 hari kerja.',
    status: 'delivered',
    pengajuanId: 'kgb-2026-001',
    noPengajuan: 'KGB/BWS-SBG/2026/001',
    timestamp: '2026-10-02T09:21:00Z'
  },
  {
    id: 'elog-2',
    toEmail: 'siti.rahmawati@bawaslu-subang.go.id',
    toName: 'Siti Rahmawati, S.H.',
    subject: '[Bawaslu Subang] Surat Pemberitahuan KGB Disetujui - KGB/BWS-SBG/2026/002',
    contentSnippet: 'Kabar baik, pengajuan Kenaikan Gaji Berkala Anda telah Disetujui dengan No. SK: 045.2/KP.04.00/JB-22/10/2026. Gaji baru TMT Oktober 2026.',
    status: 'delivered',
    pengajuanId: 'kgb-2026-002',
    noPengajuan: 'KGB/BWS-SBG/2026/002',
    timestamp: '2026-09-30T10:01:00Z'
  },
  {
    id: 'elog-3',
    toEmail: 'ahmad.fauzi@bawaslu-subang.go.id',
    toName: 'Ahmad Fauzi, S.Kom',
    subject: '[Bawaslu Subang] Tindak Lanjut: Perbaikan Dokumen KGB/BWS-SBG/2026/003',
    contentSnippet: 'Pengajuan KGB Anda memerlukan perbaikan: Mohon lampirkan lembar SKP tahun 2025 yang telah ditandatangani pejabat penilai.',
    status: 'delivered',
    pengajuanId: 'kgb-2026-003',
    noPengajuan: 'KGB/BWS-SBG/2026/003',
    timestamp: '2026-10-03T16:21:00Z'
  }
];

export const DIVISI_OPTIONS = [
  'Sekretariat / Sub Bagian Administrasi',
  'Divisi SDM, Organisasi, dan Diklat',
  'Divisi Pencegahan, Parmas, dan Humas',
  'Divisi Penanganan Pelanggaran dan Datin',
  'Divisi Hukum dan Penyelesaian Sengketa'
];

export const AGAMA_OPTIONS = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu'
];

export const GOLONGAN_OPTIONS = [
  'Pengatur Muda / II/a',
  'Pengatur Muda Tk. I / II/b',
  'Pengatur / II/c',
  'Pengatur Tk. I / II/d',
  'Penata Muda / III/a',
  'Penata Muda Tk. I / III/b',
  'Penata / III/c',
  'Penata Tk. I / III/d',
  'Pembina / IV/a',
  'Pembina Tk. I / IV/b',
  'Pembina Utama Muda / IV/c'
];

export const INITIAL_TEMPLATES: TemplateDokumen[] = [
  {
    id: 'tmpl-pengantar-provinsi',
    nama: 'Surat Pengantar Usulan KGB ke Bawaslu Provinsi Jawa Barat',
    deskripsi: 'Surat pengantar usulan Kenaikan Gaji Berkala pegawai kepada Bawaslu Provinsi Jawa Barat.',
    kategori: 'surat_pengantar',
    formatNomor: '001/KP.03.01/JB-15/{BULAN_PADDED}/{TAHUN}',
    judulDokumen: 'SURAT PENGANTAR',
    isiKonten: `Subang, {TANGGAL_SURAT}

Nomor : {NOMOR_SURAT}
Sifat : Biasa
Lampiran : 1 (Satu) Bundel
Hal : Usulan Kenaikan Gaji Berkala di Sekretariat Bawaslu Kabupaten Subang

Yth. Kepala Sekretariat Bawaslu Provinsi Jawa Barat
di
  Bandung

Dengan hormat,

Sehubungan dengan Kenaikan Gaji Berkala Periode {TMT_KGB_FORMAT}, bersama ini kami sampaikan usulan Kenaikan Gaji Berkala untuk Pegawai Negeri Sipil (PNS) Bawaslu Kabupaten Subang dengan data Pegawai sebagai berikut:

Nama : {NAMA_PEGAWAI}
NIP : {NIP}
Golongan : {PANGKAT_GOLONGAN}
Jabatan : {JABATAN}

Sebagai dasar pertimbangan usulan ini, kami lampirkan berkas-berkas pendukung yang dipersyaratkan antara lain sebagai berikut:
1. Surat Keputusan Pengangkatan PNS/ PPPK
2. Surat Keputusan Kenaikan Gaji Berkala*)
3. Sasaran Kinerja Pegawai 2 Tahun Terakhir

Demikian surat usulan ini disampaikan, untuk digunakan sebagaimana mestinya. Atas perhatiannya diucapkan terima kasih.`,

    penandatanganNama: 'H. TATANG KOSWARA, S.Sos., M.Si',
    penandatanganJabatan: 'Kepala Sekretariat Bawaslu Kabupaten Subang',
    penandatanganNip: '197405121998031002',
    tembusan: [],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl-tanda-terima',
    nama: 'Bukti Tanda Terima Berkas Elektronik',
    deskripsi: 'Bukti resmi penyerahan dan penerimaan dokumen persyaratan KGB digital.',
    kategori: 'tanda_terima',
    formatNomor: 'TND/KGB/{BULAN}/{TAHUN}',
    judulDokumen: 'BUKTI TANDA TERIMA PENGAJUAN KGB ELEKTRONIK',
    isiKonten: `Telah diterima berkas permohonan Kenaikan Gaji Berkala melalui Sistem Informasi SI-KGB Bawaslu Kabupaten Subang:

- Nomor Registrasi : {NOMOR_SURAT}
- Nama Pemohon     : {NAMA_PEGAWAI}
- NIP              : {NIP}
- Jabatan          : {JABATAN}
- Tanggal Terima   : {TANGGAL_SURAT}

Kelengkapan Berkas Terlampir:
[✓] Salinan SK Kenaikan Pangkat Terakhir
[✓] Salinan SK Kenaikan Gaji Berkala Terakhir
[✓] Dokumen Penilaian Prestasi Kerja / SKP 2 Tahun Terakhir

Tanda terima ini merupakan bukti sah bahwa berkas telah masuk dalam antrean verifikasi administrasi kepegawaian.`,
    penandatanganNama: 'Sub Bagian Administrasi Bawaslu Subang',
    penandatanganJabatan: 'Petugas Pelayanan Terpadu Satu Pintu',
    penandatanganNip: '198906152015031002',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  }
];
