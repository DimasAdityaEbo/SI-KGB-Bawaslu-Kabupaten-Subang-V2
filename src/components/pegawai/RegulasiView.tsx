import React from 'react';
import { BookOpen, GitPullRequest, CheckSquare, Clock, Award, CheckCircle2 } from 'lucide-react';

export const RegulasiView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Layanan Kenaikan Gaji Berkala (KGB) ASN
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Badan Pengawas Pemilihan Umum Kabupaten Subang · Standar Pelayanan Publik
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
        {/* Dasar Hukum */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <span>DASAR HUKUM</span>
          </div>
          <ul className="space-y-2.5 leading-relaxed text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold">•</span>
              <span>
                <strong>Undang-Undang Nomor 25 Tahun 2009</strong> tentang Pelayanan Publik
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold">•</span>
              <span>
                <strong>Undang-Undang Nomor 20 Tahun 2023</strong> tentang Aparatur Sipil Negara
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold">•</span>
              <span>
                <strong>Peraturan Pemerintah Nomor 17 Tahun 2020</strong> tentang Perubahan atas Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold">•</span>
              <span>
                <strong>Peraturan Pemerintah Nomor 5 Tahun 2024</strong> tentang Perubahan Kesembilanbelas atas Peraturan Pemerintah Nomor 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil
              </span>
            </li>
          </ul>
        </div>

        {/* Persyaratan Lengkap */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <span>PERSYARATAN</span>
          </div>
          <ul className="space-y-3 leading-relaxed text-slate-700">
            <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-emerald-600 font-bold text-sm">✓</span>
              <div>
                <strong className="text-slate-900 text-xs">Sasaran Kinerja Pegawai (SKP) 2 tahun Terakhir</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">Penilaian kinerja ASN dengan predikat sekurang-kurangnya bernilai baik.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-emerald-600 font-bold text-sm">✓</span>
              <div>
                <strong className="text-slate-900 text-xs">Surat Kenaikan Gaji Berkala Terakhir</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">Salinan SK KGB periode sebelumnya sebagai dasar penghitungan masa kerja golongan.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-emerald-600 font-bold text-sm">✓</span>
              <div>
                <strong className="text-slate-900 text-xs">SK Kenaikan Pangkat Terakhir</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">Salinan sah Surat Keputusan Pangkat terakhir yang telah dilegalisir / scan asli.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Alur Layanan Kenaikan Gaji Berkala (9 Tahap) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <GitPullRequest className="h-4 w-4 text-sky-600" />
            <span>ALUR LAYANAN KENAIKAN GAJI BERKALA (9 TAHAPAN)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">1. Notifikasi H-30</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Pegawai menerima Notifikasi Pengingat Kenaikan Gaji Berkala H-30.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">2. Verifikasi Usulan</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Bagian Sumber Daya Manusia Bawaslu Subang memverifikasi data usulan.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">3. Usulan ke Bawaslu Jabar</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Bagian Sumber Daya Manusia Bawaslu Subang membuat usulan KGB kepada Bawaslu Provinsi Jawa Barat.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">4. Pemrosesan Usulan</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Bawaslu Provinsi Jawa Barat memproses usulan Kenaikan Gaji Berkala.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">5. Penerbitan SK KGB</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Penerbitan Surat Keputusan Kenaikan Gaji Berkala resmi.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">6. Pengiriman SK KGB</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Pengiriman SK KGB yang telah ditandatangani pejabat berwenang melalui Bagian SDM Bawaslu Subang.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">7. Penyampaian ke ASN</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Penyampaian salinan SK KGB kepada ASN yang bersangkutan.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs">8. Sinkronisasi Keuangan</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Pemberitahuan kepada Bagian Keuangan Bawaslu Subang untuk sinkronisasi data KGB penyesuaian gaji.</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-950 block text-xs">9. Pembayaran Gaji</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">Pembayaran gaji sesuai dengan besaran SK KGB terbaru.</p>
            </div>
          </div>
        </div>

        {/* Waktu Pelayanan, Produk Layanan, & Biaya */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>WAKTU PELAYANAN, PRODUK LAYANAN, &amp; BIAYA</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-slate-500 font-semibold text-[11px]">WAKTU PELAYANAN:</p>
              <p className="text-base font-bold text-slate-900 font-mono mt-1">7 (tujuh) Hari Kerja</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sejak berkas permohonan dinyatakan lengkap.</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-slate-500 font-semibold text-[11px]">PRODUK LAYANAN:</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Surat Usulan Kenaikan Gaji Berkala</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dokumen usulan resmi Bawaslu Kabupaten Subang.</p>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
              <p className="text-emerald-800 font-semibold text-[11px]">BIAYA PELAYANAN:</p>
              <p className="text-base font-bold text-emerald-900 mt-1">Gratis (Rp 0,-)</p>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">Bebas biaya administrasi apa pun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
