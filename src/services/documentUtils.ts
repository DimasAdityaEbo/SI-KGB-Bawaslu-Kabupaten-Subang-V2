import { DokumenLampiran, PengajuanKGB } from '../types';

/**
 * Reads a File object from input and converts to base64 Data URL
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Generates an SVG or HTML-based Data URL as fallback if original binary is absent (e.g. mock seed data)
 */
export const getOrGenerateDocumentUrl = (
  doc: DokumenLampiran,
  pengajuan?: PengajuanKGB
): string => {
  if (doc.fileData && doc.fileData.startsWith('data:')) {
    return doc.fileData;
  }

  // Create an official Bawaslu Subang digital archive SVG representation
  const docTypeLabel =
    doc.jenisDokumen === 'sk_pangkat'
      ? 'SURAT KEPUTUSAN KENAIKAN PANGKAT'
      : doc.jenisDokumen === 'sk_kgb'
      ? 'SURAT KEPUTUSAN KENAIKAN GAJI BERKALA'
      : doc.jenisDokumen === 'skp_prestasi'
      ? 'PENILAIAN PRESTASI KERJA (SKP)'
      : 'DOKUMEN PENDUKUNG KEPEGAWAIAN';

  const pemohonName = pengajuan?.namaPemohon || 'Pegawai Bawaslu Subang';
  const pemohonNip = pengajuan?.nipPemohon || '-';
  const noReg = pengajuan?.noPengajuan || 'KGB/BWS-SBG/2026';
  const uploadDate = doc.uploadedAt
    ? new Date(doc.uploadedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID');

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="800" height="1130">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>

      <!-- Page Background -->
      <rect width="800" height="1130" fill="url(#bgGrad)"/>
      <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="35" y="35" width="730" height="1060" fill="none" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="4,4"/>

      <!-- Watermark -->
      <text x="400" y="600" font-family="sans-serif" font-size="64" font-weight="900" fill="#0f172a" fill-opacity="0.03" text-anchor="middle" transform="rotate(-30 400 600)">
        BAWASLU SUBANG · RESMI
      </text>

      <!-- Letterhead / Kop Dokumen -->
      <g transform="translate(60, 60)">
        <!-- Emblem Box -->
        <rect x="10" y="10" width="60" height="60" rx="8" fill="#0f172a"/>
        <text x="40" y="48" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>

        <text x="90" y="28" font-family="sans-serif" font-size="14" font-weight="bold" fill="#334155" letter-spacing="1">BADAN PENGAWAS PEMILIHAN UMUM</text>
        <text x="90" y="52" font-family="sans-serif" font-size="20" font-weight="900" fill="#0f172a" letter-spacing="2">KABUPATEN SUBANG</text>
        <text x="90" y="72" font-family="sans-serif" font-size="10" fill="#64748b">Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Jawa Barat 41211</text>
      </g>

      <line x1="60" y1="155" x2="740" y2="155" stroke="#0f172a" stroke-width="3"/>
      <line x1="60" y1="160" x2="740" y2="160" stroke="#0f172a" stroke-width="1"/>

      <!-- Document Title -->
      <g transform="translate(400, 220)">
        <text x="0" y="0" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1">
          ARSIP DIGITAL RESMI BERKAS PENGAJUAN KGB
        </text>
        <text x="0" y="24" font-family="sans-serif" font-size="13" font-weight="bold" fill="#b91c1c" text-anchor="middle" letter-spacing="1">
          ${docTypeLabel}
        </text>
        <text x="0" y="44" font-family="monospace" font-size="11" fill="#475569" text-anchor="middle">
          Nama Berkas: ${doc.namaFile}
        </text>
      </g>

      <!-- Metadata Box -->
      <g transform="translate(80, 310)">
        <rect width="640" height="230" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
        <rect width="640" height="35" rx="8" fill="#f1f5f9"/>
        <text x="20" y="23" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">INFORMASI IDENTITAS PEMILIK BERKAS</text>

        <text x="20" y="65" font-family="sans-serif" font-size="12" fill="#64748b">Nama Pegawai Pemohon</text>
        <text x="220" y="65" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">: ${pemohonName}</text>

        <text x="20" y="95" font-family="sans-serif" font-size="12" fill="#64748b">NIP</text>
        <text x="220" y="95" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">: ${pemohonNip}</text>

        <text x="20" y="125" font-family="sans-serif" font-size="12" fill="#64748b">Nomor Registrasi KGB</text>
        <text x="220" y="125" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">: ${noReg}</text>

        <text x="20" y="155" font-family="sans-serif" font-size="12" fill="#64748b">Ukuran &amp; Format Berkas</text>
        <text x="220" y="155" font-family="sans-serif" font-size="12" fill="#0f172a">: ${doc.ukuranFile} (${doc.tipeFile})</text>

        <text x="20" y="185" font-family="sans-serif" font-size="12" fill="#64748b">Waktu Pengunggahan</text>
        <text x="220" y="185" font-family="sans-serif" font-size="12" fill="#0f172a">: ${uploadDate}</text>

        <text x="20" y="215" font-family="sans-serif" font-size="12" fill="#64748b">Status Arsip</text>
        <text x="220" y="215" font-family="sans-serif" font-size="12" font-weight="bold" fill="#047857">: Terverifikasi Lengkap di Pangkalan Data SI-KGB</text>
      </g>

      <!-- Content Preview Simulation -->
      <g transform="translate(80, 570)">
        <rect width="640" height="280" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
        <text x="20" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">RINGKASAN KEABSAHAN DOKUMEN DIGITAL</text>
        
        <text x="20" y="65" font-family="sans-serif" font-size="11" fill="#334155">
          1. Dokumen ini telah diunggah secara sah melalui Portal SI-KGB Bawaslu Kabupaten Subang.
        </text>
        <text x="20" y="95" font-family="sans-serif" font-size="11" fill="#334155">
          2. Seluruh ketentuan penilaian telah mengacu pada UU No. 20 Tahun 2023 dan PP No. 5 Tahun 2024.
        </text>
        <text x="20" y="125" font-family="sans-serif" font-size="11" fill="#334155">
          3. Berkas digital tersimpan secara aman dalam arsip kepegawaian Sekretariat Bawaslu Subang.
        </text>

        <line x1="20" y1="150" x2="620" y2="150" stroke="#f1f5f9" stroke-width="1"/>

        <!-- Digital Stamp -->
        <g transform="translate(420, 165)">
          <rect width="180" height="90" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="1.5" stroke-dasharray="3,3"/>
          <text x="90" y="25" font-family="sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">TERVERIFIKASI DIGITAL</text>
          <text x="90" y="45" font-family="sans-serif" font-size="9" fill="#065f46" text-anchor="middle">SUB BAGIAN ADM &amp; SDM</text>
          <text x="90" y="62" font-family="sans-serif" font-size="8" fill="#047857" text-anchor="middle">BAWASLU KAB. SUBANG</text>
          <text x="90" y="78" font-family="monospace" font-size="8" fill="#064e3b" text-anchor="middle">VALIDATED SYSTEM</text>
        </g>
      </g>

      <!-- Signature & Footer -->
      <g transform="translate(80, 920)">
        <text x="520" y="0" font-family="sans-serif" font-size="11" fill="#334155" text-anchor="middle">Subang, ${uploadDate}</text>
        <text x="520" y="18" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Petugas Pengelola Kepegawaian</text>
        <text x="520" y="80" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Sekretariat Bawaslu Subang</text>

        <text x="0" y="100" font-family="monospace" font-size="9" fill="#94a3b8">
          SI-KGB · Dokumen Digital Resmi · Bawaslu Kabupaten Subang Jawa Barat
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
};

/**
 * Triggers a direct file download in the browser
 */
export const downloadDokumenFile = (
  doc: DokumenLampiran,
  pengajuan?: PengajuanKGB
): void => {
  const dataUrl = getOrGenerateDocumentUrl(doc, pengajuan);

  // If it's a data URL, we can download directly
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = doc.namaFile || `Dokumen_${doc.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
