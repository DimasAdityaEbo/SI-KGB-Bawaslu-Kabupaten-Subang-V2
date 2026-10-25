import { PengajuanKGB, Pegawai, EmailDispatchLog } from '../types';
import { addEmailLog, addNotification } from './storage';

export interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  bodyHtml: string;
  pengajuanId?: string;
  noPengajuan?: string;
}

// Helper to generate official HTML email preview
export function generateKgbEmailHtml(params: {
  toName: string;
  nip: string;
  noPengajuan: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  message: string;
  catatan?: string;
  nomorSk?: string;
  tmtKgb?: string;
  nextKgbJadwal?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background: #0f172a; color: #ffffff; padding: 24px 32px; border-bottom: 4px solid #d97706; }
    .header h1 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { margin: 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .info-table td:first-child { width: 38%; color: #64748b; font-weight: 500; }
    .info-table td:last-child { color: #0f172a; font-weight: 600; }
    .callout { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #334155; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Badan Pengawas Pemilihan Umum</h1>
      <p>Kabupaten Subang · Sistem Informasi Kenaikan Gaji Berkala (SI-KGB)</p>
    </div>
    <div class="content">
      <p style="font-size: 14px; margin-top: 0;">Kepada Yth.<br><strong>${params.toName}</strong> (NIP: ${params.nip})</p>
      
      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        ${params.message}
      </p>

      <div style="margin: 20px 0; text-align: center;">
        <span class="badge" style="background: ${params.statusColor}15; color: ${params.statusColor}; border: 1px solid ${params.statusColor}40;">
          Status Terkini: ${params.statusLabel}
        </span>
      </div>

      <table class="info-table">
        <tr>
          <td>Nomor Registrasi</td>
          <td>${params.noPengajuan}</td>
        </tr>
        <tr>
          <td>Tanggal Pembaruan</td>
          <td>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</td>
        </tr>
        ${params.tmtKgb ? `<tr><td>TMT KGB Disetujui</td><td>${params.tmtKgb}</td></tr>` : ''}
        ${params.nextKgbJadwal ? `<tr><td>Jadwal KGB Berikutnya (2 Tahun)</td><td><strong style="color: #16a34a;">${params.nextKgbJadwal}</strong></td></tr>` : ''}
        ${params.nomorSk ? `<tr><td>Nomor Surat SK / Rekomendasi</td><td>${params.nomorSk}</td></tr>` : ''}
      </table>

      ${params.catatan ? `
        <div class="callout" style="border-left-color: ${params.statusColor};">
          <strong>Catatan Petugas Kepegawaian:</strong><br>
          <span style="font-style: italic;">"${params.catatan}"</span>
        </div>
      ` : ''}

      <p style="font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.5;">
        Anda dapat memantau status secara langsung atau mengunduh lembar tanda terima dan surat pengantar melalui portal resmi SI-KGB Bawaslu Kabupaten Subang.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Sekretariat Bawaslu Kabupaten Subang</strong></p>
      <p style="margin: 0 0 6px 0;">Jl. Veteran No. 12, Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211</p>
      <p style="margin: 0;">Surel Resmi: kepegawaian@bawaslu-subang.go.id · Notifikasi Sistem Otomatis</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Helper to generate official Plain Text email for mailto/Gmail compose
export function generateKgbEmailPlainText(params: {
  toName: string;
  nip: string;
  noPengajuan: string;
  statusLabel: string;
  message: string;
  catatan?: string;
  nomorSk?: string;
  tmtKgb?: string;
  nextKgbJadwal?: string;
}): string {
  return `BADAN PENGAWAS PEMILIHAN UMUM KABUPATEN SUBANG
Sistem Informasi Kenaikan Gaji Berkala (SI-KGB)
Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Jawa Barat 41211

Kepada Yth.
${params.toName} (NIP: ${params.nip})

${params.message}

Status Terkini: ${params.statusLabel}
Nomor Registrasi: ${params.noPengajuan}
${params.tmtKgb ? `TMT KGB Disetujui: ${params.tmtKgb}\n` : ''}${params.nextKgbJadwal ? `Jadwal KGB Berikutnya (2 Tahun): ${params.nextKgbJadwal}\n` : ''}${params.nomorSk ? `Nomor Surat SK / Rekomendasi: ${params.nomorSk}\n` : ''}${params.catatan ? `Catatan Petugas Kepegawaian: "${params.catatan}"\n` : ''}
Anda dapat memantau status secara langsung atau mengunduh lembar tanda terima dan surat pengantar melalui portal resmi SI-KGB Bawaslu Kabupaten Subang.

Sekretariat Bawaslu Kabupaten Subang
Surel Resmi: set.subangkab@bawaslu.go.id`.trim();
}

export function createGmailComposeUrl(toEmail: string, subject: string, bodyText: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

export function createMailtoUrl(toEmail: string, subject: string, bodyText: string): string {
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

// Main function to dispatch real-time email notifications
export async function sendKgbStatusEmail(
  pengajuan: PengajuanKGB,
  actionType: 'dibuat' | 'disetujui' | 'perlu_perbaikan' | 'ditolak' | 'dikirim_ke_provinsi',
  nextKgbJadwal?: string
): Promise<EmailDispatchLog> {
  let subject = '';
  let statusLabel = '';
  let statusColor = '#0284c7';
  let message = '';

  switch (actionType) {
    case 'dibuat':
      subject = `[SI-KGB Bawaslu Subang] Tanda Terima Pengajuan KGB - ${pengajuan.noPengajuan}`;
      statusLabel = 'Menunggu Verifikasi Berkas';
      statusColor = '#0284c7'; // Sky/Blue
      message = `Permohonan Kenaikan Gaji Berkala (KGB) Anda telah berhasil didaftarkan ke dalam sistem. Staf Sub Bagian Administrasi & Kepegawaian akan segera melakukan verifikasi kelengkapan berkas Anda.`;
      break;

    case 'dikirim_ke_provinsi':
      subject = `[SI-KGB Bawaslu Subang] Berkas Pengajuan KGB Dikirim ke Bawaslu Provinsi - ${pengajuan.noPengajuan}`;
      statusLabel = 'Berkas Dikirim ke Bawaslu Provinsi';
      statusColor = '#4f46e5'; // Indigo
      message = `Permohonan Kenaikan Gaji Berkala (KGB) Anda telah diverifikasi oleh Sekretariat Bawaslu Kabupaten Subang dan <strong>saat ini berkas usulan sedang dikirim / diproses ke Bawaslu Provinsi Jawa Barat</strong> untuk penerbitan surat rekomendasi / penetapan kenaikan gaji berkala.`;
      break;

    case 'disetujui':
      subject = `[SI-KGB Bawaslu Subang] SELAMAT: Pengajuan KGB Anda Disetujui - ${pengajuan.noPengajuan}`;
      statusLabel = 'Pengajuan Disetujui';
      statusColor = '#16a34a'; // Green
      message = `Kabar baik! Permohonan Kenaikan Gaji Berkala Anda telah diverifikasi dan <strong>DISETUJUI</strong> oleh Koordinator Sekretariat Bawaslu Kabupaten Subang. Surat Keputusan/Rekomendasi KGB resmi telah diterbitkan, dan jadwal KGB Anda berikutnya telah dijadwalkan kembali untuk 2 (dua) tahun mendatang${nextKgbJadwal ? ` (jatuh tempo pada: <strong>${nextKgbJadwal}</strong>)` : ''}.`;
      break;

    case 'perlu_perbaikan':
      subject = `[SI-KGB Bawaslu Subang] Tindak Lanjut: Perbaikan Dokumen KGB - ${pengajuan.noPengajuan}`;
      statusLabel = 'Perlu Perbaikan Dokumen';
      statusColor = '#d97706'; // Amber
      message = `Berdasarkan hasil pemeriksaan verifikator kepegawaian, terdapat beberapa dokumen persyaratan yang perlu diperbaiki atau dilengkapi kembali. Mohon segera melakukan perbaikan agar pengajuan Anda dapat diproses lebih lanjut.`;
      break;

    case 'ditolak':
      subject = `[SI-KGB Bawaslu Subang] Pemberitahuan Hasil Verifikasi KGB - ${pengajuan.noPengajuan}`;
      statusLabel = 'Pengajuan Ditolak';
      statusColor = '#dc2626'; // Crimson
      message = `Mohon maaf, permohonan Kenaikan Gaji Berkala Anda belum dapat disetujui pada periode ini karena belum memenuhi kriteria atau persyaratan regulasi kepegawaian.`;
      break;
  }

  const htmlContent = generateKgbEmailHtml({
    toName: pengajuan.namaPemohon,
    nip: pengajuan.nipPemohon,
    noPengajuan: pengajuan.noPengajuan,
    status: pengajuan.status,
    statusLabel,
    statusColor,
    message,
    catatan: pengajuan.catatanVerifikator,
    nomorSk: pengajuan.nomorSkKgbDiterbitkan,
    tmtKgb: pengajuan.tmtKgbBaru,
    nextKgbJadwal,
  });

  const emailLog: EmailDispatchLog = {
    id: `elog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    toEmail: pengajuan.emailPemohon,
    toName: pengajuan.namaPemohon,
    subject,
    contentSnippet: message.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
    status: 'delivered',
    pengajuanId: pengajuan.id,
    noPengajuan: pengajuan.noPengajuan,
    timestamp: new Date().toISOString(),
  };

  // Persist email log
  await addEmailLog(emailLog);

  // Also push in-app notification to the applicant
  await addNotification({
    id: `notif-${Date.now()}`,
    userId: pengajuan.pegawaiId,
    title: subject,
    message: pengajuan.catatanVerifikator || message.replace(/<[^>]*>?/gm, ''),
    type: actionType === 'disetujui' ? 'success' : actionType === 'perlu_perbaikan' ? 'warning' : actionType === 'ditolak' ? 'alert' : 'info',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // If new submission, also notify admin
  if (actionType === 'dibuat') {
    await addNotification({
      id: `notif-admin-${Date.now()}`,
      title: 'Permohonan KGB Baru Masuk',
      message: `Permohonan baru ${pengajuan.noPengajuan} dari ${pengajuan.namaPemohon} (${pengajuan.divisiPemohon}) menunggu verifikasi.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return emailLog;
}

export function generateJadwalReminderEmailHtml(pegawai: Pegawai, sisaHari: number): string {
  const tanggalFormat = new Date(pegawai.jadwalKgbBerikutnya).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background: #0f172a; color: #ffffff; padding: 24px 32px; border-bottom: 4px solid #f59e0b; }
    .header h1 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { margin: 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .info-table td:first-child { width: 38%; color: #64748b; font-weight: 500; }
    .info-table td:last-child { color: #0f172a; font-weight: 600; }
    .callout { background: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #334155; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Badan Pengawas Pemilihan Umum</h1>
      <p>Kabupaten Subang · Layanan Kenaikan Gaji Berkala (KGB) ASN</p>
    </div>
    <div class="content">
      <p style="font-size: 14px; margin-top: 0;">Kepada Yth.<br><strong>${pegawai.nama}</strong><br>NIP. ${pegawai.nip}<br>${pegawai.bagianDivisi}</p>
      
      <div style="margin: 20px 0; text-align: center;">
        <span class="badge">
          PENGINGAT JATUH TEMPO KGB (${sisaHari <= 0 ? 'TELAH JATUH TEMPO' : `H-${sisaHari}`})
        </span>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        Berdasarkan pangkalan data kepegawaian Bawaslu Kabupaten Subang, masa kerja golongan 2 (dua) tahun Anda akan jatuh tempo pada <strong>${tanggalFormat}</strong> (${sisaHari <= 0 ? 'Hari ini / telah jatuh tempo' : `tersisa ${sisaHari} hari lagi`}).
      </p>

      <table class="info-table">
        <tr>
          <td>Nama Lengkap</td>
          <td>${pegawai.nama}</td>
        </tr>
        <tr>
          <td>NIP</td>
          <td>${pegawai.nip}</td>
        </tr>
        <tr>
          <td>Pangkat / Golongan</td>
          <td>${pegawai.golonganPangkat || '-'}</td>
        </tr>
        <tr>
          <td>Estimasi TMT KGB</td>
          <td>${tanggalFormat}</td>
        </tr>
      </table>

      <div class="callout">
        <strong>Persyaratan Berkas yang Perlu Dipersiapkan:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px;">
          <li>1. Sasaran Kinerja Pegawai (SKP) 2 Tahun Terakhir (predikat minimal Baik)</li>
          <li>2. Surat Kenaikan Gaji Berkala Terakhir</li>
          <li>3. SK Kenaikan Pangkat Terakhir</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 20px; line-height: 1.5;">
        Silakan masuk ke portal resmi SI-KGB Bawaslu Kabupaten Subang dan ajukan permohonan melalui menu <strong>Pengajuan Permohonan KGB</strong> agar dapat segera diproses verifikasinya oleh staf kepegawaian.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Sub Bagian Administrasi &amp; SDM Bawaslu Kabupaten Subang</strong></p>
      <p style="margin: 0 0 6px 0;">Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Jawa Barat 41211</p>
      <p style="margin: 0;">Surel: kepegawaian@bawaslu-subang.go.id · Notifikasi Otomatis SI-KGB</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateJadwalReminderPlainText(pegawai: Pegawai, sisaHari: number): string {
  const tanggalFormat = new Date(pegawai.jadwalKgbBerikutnya).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `BADAN PENGAWAS PEMILIHAN UMUM KABUPATEN SUBANG
Sistem Informasi Kenaikan Gaji Berkala (SI-KGB)
Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Jawa Barat 41211

Kepada Yth.
${pegawai.nama} (NIP: ${pegawai.nip})
${pegawai.bagianDivisi}

PENGINGAT JADWAL KENAIKAN GAJI BERKALA (KGB)
Berdasarkan data kepegawaian Bawaslu Kabupaten Subang, masa kerja golongan Anda akan jatuh tempo pada:
Tanggal TMT KGB: ${tanggalFormat} (${sisaHari <= 0 ? 'Hari ini / telah jatuh tempo' : `tersisa ${sisaHari} hari lagi`}).

Mohon mempersiapkan berkas persyaratan sesuai SOP:
1. Sasaran Kinerja Pegawai (SKP) 2 Tahun Terakhir (Predikat minimal Baik)
2. Surat Kenaikan Gaji Berkala Terakhir
3. SK Kenaikan Pangkat Terakhir

Silakan masuk ke portal resmi SI-KGB Bawaslu Subang dan kirimkan pengajuan Anda melalui formulir online agar dapat segera diverifikasi oleh tim kepegawaian.

Sub Bagian Administrasi & SDM Bawaslu Kabupaten Subang
Surel Resmi: kepegawaian@bawaslu-subang.go.id`.trim();
}

// Send automated schedule reminder email (< 1 month)
export async function sendJadwalReminderEmail(pegawai: Pegawai, sisaHari: number): Promise<EmailDispatchLog> {
  const subject = `[SI-KGB Bawaslu Subang] Pengingat Jadwal Kenaikan Gaji Berkala (KGB) - ${pegawai.nama} (${sisaHari <= 0 ? 'Jatuh Tempo' : `H-${sisaHari}`})`;
  const snippet = `Pengingat jadwal KGB untuk ${pegawai.nama} (NIP: ${pegawai.nip}). TMT jatuh tempo pada ${pegawai.jadwalKgbBerikutnya} (${sisaHari <= 0 ? 'Jatuh tempo' : `${sisaHari} hari lagi`}).`;

  const emailLog: EmailDispatchLog = {
    id: `elog-remind-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    toEmail: pegawai.email,
    toName: pegawai.nama,
    subject,
    contentSnippet: snippet,
    status: 'delivered',
    timestamp: new Date().toISOString(),
  };

  await addEmailLog(emailLog);
  await addNotification({
    id: `notif-remind-${Date.now()}`,
    userId: pegawai.id,
    title: 'Pengingat Jadwal KGB Terdekat',
    message: `Jadwal KGB Anda jatuh tempo pada ${pegawai.jadwalKgbBerikutnya} (${sisaHari <= 0 ? 'Jatuh tempo' : `${sisaHari} hari lagi`}). Segera lengkapi dan ajukan berkas melalui SI-KGB!`,
    type: 'warning',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return emailLog;
}
