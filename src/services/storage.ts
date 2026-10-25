import {
  Pegawai,
  User,
  PengajuanKGB,
  NotificationItem,
  EmailDispatchLog,
  PengajuanStatus,
  TemplateDokumen,
  KopSuratConfig,
  TandaTanganCapConfig,
} from '../types';
import {
  INITIAL_PEGAWAI,
  INITIAL_USERS,
  INITIAL_PENGAJUAN,
  INITIAL_NOTIFICATIONS,
  INITIAL_EMAIL_LOGS,
  INITIAL_TEMPLATES,
} from '../data/seedData';
import {
  DEFAULT_CAP_BAWASLU_SVG,
  DEFAULT_TANDA_TANGAN_SVG,
  DEFAULT_TANDA_TANGAN_KASUBAG_SVG,
} from '../data/defaultSignatureAssets';
import { getSupabaseClient } from './supabase';
import { saveDocumentBinary, getDocumentBinary } from './idbStorage';

// Safe localStorage set to prevent QuotaExceededError when storing files or large lists
export function safeLocalStorageSet(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`localStorage quota warning for key "${key}", saving lightweight version`, e);
    try {
      if (Array.isArray(data)) {
        const lightweight = data.map((item) => {
          if (!item || typeof item !== 'object') return item;
          const copy = { ...item };
          if (copy.skPangkatTerakhir && copy.skPangkatTerakhir.fileData) {
            copy.skPangkatTerakhir = { ...copy.skPangkatTerakhir, fileData: undefined };
          }
          if (copy.dokumenSkpPrestasi && copy.dokumenSkpPrestasi.fileData) {
            copy.dokumenSkpPrestasi = { ...copy.dokumenSkpPrestasi, fileData: undefined };
          }
          if (copy.skGajiBerkalaTerakhir && copy.skGajiBerkalaTerakhir.fileData) {
            copy.skGajiBerkalaTerakhir = { ...copy.skGajiBerkalaTerakhir, fileData: undefined };
          }
          return copy;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch (err2) {
      console.error('Safe localStorage fallback failed:', err2);
    }
  }
}

const KEYS = {
  PEGAWAI: 'sikgb_pegawai_v1',
  USERS: 'sikgb_users_v1',
  PENGAJUAN: 'sikgb_pengajuan_v1',
  NOTIFICATIONS: 'sikgb_notifications_v1',
  EMAIL_LOGS: 'sikgb_email_logs_v1',
  TEMPLATES: 'sikgb_templates_v1',
  KOP_SURAT: 'sikgb_kop_surat_v1',
  TANDA_TANGAN_CAP: 'sikgb_ttd_cap_v1',
};

// Initialize localStorage with seed data if empty
function initializeLocalStorage(): void {
  if (!localStorage.getItem(KEYS.PEGAWAI)) {
    localStorage.setItem(KEYS.PEGAWAI, JSON.stringify(INITIAL_PEGAWAI));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(KEYS.PENGAJUAN)) {
    localStorage.setItem(KEYS.PENGAJUAN, JSON.stringify(INITIAL_PENGAJUAN));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(KEYS.EMAIL_LOGS)) {
    localStorage.setItem(KEYS.EMAIL_LOGS, JSON.stringify(INITIAL_EMAIL_LOGS));
  }
  if (!localStorage.getItem(KEYS.TEMPLATES)) {
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
  }
}

initializeLocalStorage();

export function getLocalDataSnapshot(): {
  pegawai: Pegawai[];
  users: User[];
  pengajuan: PengajuanKGB[];
  notifications: NotificationItem[];
  emailLogs: EmailDispatchLog[];
} {
  const readList = <T,>(key: string, fallback: T[]): T[] => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : fallback;
  };

  return {
    pegawai: readList(KEYS.PEGAWAI, INITIAL_PEGAWAI),
    users: readList(KEYS.USERS, INITIAL_USERS),
    pengajuan: readList(KEYS.PENGAJUAN, INITIAL_PENGAJUAN),
    notifications: readList(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
    emailLogs: readList(KEYS.EMAIL_LOGS, INITIAL_EMAIL_LOGS),
  };
}

// ======================== PEGAWAI REPOSITORY ========================
export async function getPegawaiList(): Promise<Pegawai[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('pegawai').select('*').order('nama', { ascending: true });
      if (error) throw new Error(error.message);
      if (data) {
        return data.map((d) => ({
          id: d.id,
          nama: d.nama,
          tempatLahir: d.tempat_lahir || d.tempatLahir,
          tanggalLahir: d.tanggal_lahir || d.tanggalLahir || '',
          jabatan: d.jabatan,
          nip: d.nip,
          jenisKelamin: d.jenis_kelamin || d.jenisKelamin,
          bagianDivisi: d.bagian_divisi || d.bagianDivisi,
          noHp: d.no_hp || d.noHp,
          alamatKantor: d.alamat_kantor || d.alamatKantor,
          alamatRumah: d.alamat_rumah || d.alamatRumah,
          email: d.email,
          agama: d.agama,
          tanggalPelantikan: d.tanggal_pelantikan || d.tanggalPelantikan || '',
          jadwalKgbBerikutnya: d.jadwal_kgb_berikutnya || d.jadwalKgbBerikutnya || '',
          gajiPokokTerakhir: d.gaji_pokok_terakhir ?? d.gajiPokokTerakhir,
          golonganPangkat: d.golongan_pangkat || d.golonganPangkat,
          pangkatTerakhir: d.pangkat_terakhir || d.pangkatTerakhir,
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error('Supabase fetch pegawai error:', e);
      throw e;
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(KEYS.PEGAWAI);
    return raw ? JSON.parse(raw) : INITIAL_PEGAWAI;
  } catch (e) {
    return INITIAL_PEGAWAI;
  }
}

export async function savePegawai(pegawai: Pegawai): Promise<Pegawai> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbPayload = {
        id: pegawai.id,
        nama: pegawai.nama,
        tempat_lahir: pegawai.tempatLahir,
        tanggal_lahir: pegawai.tanggalLahir || null,
        jabatan: pegawai.jabatan,
        nip: pegawai.nip,
        jenis_kelamin: pegawai.jenisKelamin,
        bagian_divisi: pegawai.bagianDivisi,
        no_hp: pegawai.noHp,
        alamat_kantor: pegawai.alamatKantor,
        alamat_rumah: pegawai.alamatRumah,
        email: pegawai.email,
        agama: pegawai.agama,
        tanggal_pelantikan: pegawai.tanggalPelantikan || null,
        jadwal_kgb_berikutnya: pegawai.jadwalKgbBerikutnya || null,
        gaji_pokok_terakhir: pegawai.gajiPokokTerakhir,
        golongan_pangkat: pegawai.golonganPangkat,
        pangkat_terakhir: pegawai.pangkatTerakhir,
      };
      const { error } = await supabase.from('pegawai').upsert(dbPayload);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase save pegawai error:', e);
      throw e;
    }
  }

  // Update local
  const current = await getPegawaiList();
  const index = current.findIndex((p) => p.id === pegawai.id);
  let updated: Pegawai[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...pegawai, updatedAt: new Date().toISOString() };
  } else {
    updated = [pegawai, ...current];
  }
  localStorage.setItem(KEYS.PEGAWAI, JSON.stringify(updated));
  return pegawai;
}

export async function deletePegawai(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('pegawai').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase delete error:', e);
      throw e;
    }
  }

  const current = await getPegawaiList();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(KEYS.PEGAWAI, JSON.stringify(updated));
  return true;
}

// ======================== PENGAJUAN KGB REPOSITORY ========================
export async function getPengajuanList(): Promise<PengajuanKGB[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pengajuan_kgb')
        .select('*')
        .order('tanggal_pengajuan', { ascending: false });

      if (error) throw new Error(error.message);
      if (data) {
        return data.map((d) => {
          let resolvedStatus = (d.status || 'menunggu_verifikasi') as PengajuanStatus;

          // Check if fallback sub_status is preserved in dokumen_pendukung_lain
          if (
            (resolvedStatus === 'dalam_proses' || resolvedStatus === 'menunggu_verifikasi') &&
            d.dokumen_pendukung_lain &&
            (d.dokumen_pendukung_lain._sub_status === 'dikirim_ke_provinsi' ||
              d.dokumen_pendukung_lain._actualStatus === 'dikirim_ke_provinsi')
          ) {
            resolvedStatus = 'dikirim_ke_provinsi';
          }

          let cleanDokumenPendukung = d.dokumen_pendukung_lain || d.dokumenPendukungLain;
          if (cleanDokumenPendukung) {
            if (
              !cleanDokumenPendukung.id &&
              (cleanDokumenPendukung._sub_status || cleanDokumenPendukung._actualStatus)
            ) {
              cleanDokumenPendukung = undefined;
            } else if (cleanDokumenPendukung._sub_status || cleanDokumenPendukung._actualStatus) {
              const { _sub_status, _actualStatus, ...restDoc } = cleanDokumenPendukung;
              cleanDokumenPendukung = restDoc;
            }
          }

          return {
            id: d.id,
            noPengajuan: d.no_pengajuan || d.noPengajuan,
            pegawaiId: d.pegawai_id || d.pegawaiId,
            namaPemohon: d.nama_pemohon || d.namaPemohon,
            nipPemohon: d.nip_pemohon || d.nipPemohon,
            jabatanPemohon: d.jabatan_pemohon || d.jabatanPemohon,
            divisiPemohon: d.divisi_pemohon || d.divisiPemohon,
            emailPemohon: d.email_pemohon || d.emailPemohon,
            noHpPemohon: d.no_hp_pemohon || d.noHpPemohon,
            perihal: d.perihal,
            periodeKgb: d.periode_kgb || d.periodeKgb,
            tmtKgbBaru: d.tmt_kgb_baru || d.tmtKgbBaru,
            gajiLama: d.gaji_lama ?? d.gajiLama,
            gajiBaruEstimasi: d.gaji_baru_estimasi ?? d.gajiBaruEstimasi,
            skPangkatTerakhir: d.sk_pangkat_terakhir || d.skPangkatTerakhir,
            skGajiBerkalaTerakhir: d.sk_gaji_berkala_terakhir || d.skGajiBerkalaTerakhir,
            dokumenSkpPrestasi: d.dokumen_skp_prestasi || d.dokumenSkpPrestasi,
            dokumenPendukungLain: cleanDokumenPendukung,
            catatanPemohon: d.catatan_pemohon || d.catatanPemohon,
            status: resolvedStatus,
            catatanVerifikator: d.catatan_verifikator || d.catatanVerifikator,
            diverifikasiOleh: d.diverifikasi_oleh || d.diverifikasiOleh,
            tanggalPengajuan: d.tanggal_pengajuan || d.tanggalPengajuan,
            tanggalVerifikasi: d.tanggal_verifikasi || d.tanggalVerifikasi,
            nomorSkKgbDiterbitkan: d.nomor_sk_kgb_diterbitkan || d.nomorSkKgbDiterbitkan,
            tanggalSkDiterbitkan: d.tanggal_sk_diterbitkan || d.tanggalSkDiterbitkan,
            dokumenSkKgbDiterbitkan: d.dokumen_sk_kgb_diterbitkan || d.dokumenSkKgbDiterbitkan || d.sk_gaji_berkala_terakhir || d.skGajiBerkalaTerakhir,
          };
        });
      }
    } catch (e) {
      console.error('Supabase fetch pengajuan error:', e);
      throw e;
    }
  }

  try {
    const raw = localStorage.getItem(KEYS.PENGAJUAN);
    return raw ? JSON.parse(raw) : INITIAL_PENGAJUAN;
  } catch (e) {
    return INITIAL_PENGAJUAN;
  }
}

export async function savePengajuan(item: PengajuanKGB): Promise<PengajuanKGB> {
  // 1. Offload heavy fileData to IndexedDB
  try {
    if (item.skPangkatTerakhir?.fileData) {
      await saveDocumentBinary(item.skPangkatTerakhir.id, item.skPangkatTerakhir.fileData);
    }
    if (item.dokumenSkpPrestasi?.fileData) {
      await saveDocumentBinary(item.dokumenSkpPrestasi.id, item.dokumenSkpPrestasi.fileData);
    }
    if (item.skGajiBerkalaTerakhir?.fileData) {
      await saveDocumentBinary(item.skGajiBerkalaTerakhir.id, item.skGajiBerkalaTerakhir.fileData);
    }
  } catch (e) {
    console.warn('Could not save binary to IndexedDB:', e);
  }

  // Sync to Supabase before updating the local cache, so failed requests do not
  // leave a local-only submission that appears to have succeeded.
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbPayload: any = {
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
        gaji_lama: item.gajiLama ?? null,
        gaji_baru_estimasi: item.gajiBaruEstimasi ?? null,
        // Trim fileData for supabase payload
        sk_pangkat_terakhir: item.skPangkatTerakhir
          ? { ...item.skPangkatTerakhir, fileData: undefined }
          : null,
        sk_gaji_berkala_terakhir: item.skGajiBerkalaTerakhir
          ? { ...item.skGajiBerkalaTerakhir, fileData: undefined }
          : null,
        dokumen_skp_prestasi: item.dokumenSkpPrestasi
          ? { ...item.dokumenSkpPrestasi, fileData: undefined }
          : null,
        dokumen_pendukung_lain: item.dokumenPendukungLain
          ? { ...item.dokumenPendukungLain, fileData: undefined }
          : null,
        catatan_pemohon: item.catatanPemohon ?? null,
        status: item.status,
        catatan_verifikator: item.catatanVerifikator ?? null,
        diverifikasi_oleh: item.diverifikasiOleh ?? null,
        tanggal_pengajuan: item.tanggalPengajuan,
        tanggal_verifikasi: item.tanggalVerifikasi ?? null,
        nomor_sk_kgb_diterbitkan: item.nomorSkKgbDiterbitkan ?? null,
        tanggal_sk_diterbitkan: item.tanggalSkDiterbitkan ?? null,
        ...(item.dokumenSkKgbDiterbitkan
          ? {
              dokumen_sk_kgb_diterbitkan: {
                ...item.dokumenSkKgbDiterbitkan,
                fileData: undefined,
              },
            }
          : {}),
      };

      const { error } = await supabase.from('pengajuan_kgb').upsert(dbPayload);
      if (error) {
        console.warn('Supabase save pengajuan first attempt warning:', error);
        // If Postgres rejected because check constraint pengajuan_kgb_status_check doesn't have dikirim_ke_provinsi yet
        if (
          error.code === '23514' ||
          error.message?.includes('status_check') ||
          error.message?.includes('violates check constraint')
        ) {
          console.info('Handling status check constraint fallback for Supabase table...');
          const fallbackPayload = {
            ...dbPayload,
            status: 'dalam_proses',
            dokumen_pendukung_lain: {
              ...(item.dokumenPendukungLain
                ? { ...item.dokumenPendukungLain, fileData: undefined }
                : {}),
              _sub_status: item.status,
            },
          };
          const { error: fallbackError } = await supabase
            .from('pengajuan_kgb')
            .upsert(fallbackPayload);
          if (fallbackError) {
            throw new Error(
              `Supabase fallback save failed (${fallbackError.code}): ${fallbackError.message}`
            );
          } else {
            console.info('Supabase fallback saved successfully with _sub_status:', item.status);
          }
        } else {
          throw new Error(`${error.code}: ${error.message}`);
        }
      }
    } catch (e) {
      console.warn('Supabase save pengajuan error:', e);
      throw e;
    }
  }

  try {
    const raw = localStorage.getItem(KEYS.PENGAJUAN);
    const localList: PengajuanKGB[] = raw ? JSON.parse(raw) : INITIAL_PENGAJUAN;
    const index = localList.findIndex((p) => p.id === item.id);
    const updated = [...localList];
    if (index >= 0) {
      updated[index] = item;
    } else {
      updated.unshift(item);
    }
    safeLocalStorageSet(KEYS.PENGAJUAN, updated);
  } catch (e) {
    console.warn('Safe localStorage set pengajuan error:', e);
  }

  return item;
}

export async function deletePengajuan(id: string): Promise<boolean> {
  // 1. Delete from localStorage
  try {
    const raw = localStorage.getItem(KEYS.PENGAJUAN);
    const localList: PengajuanKGB[] = raw ? JSON.parse(raw) : INITIAL_PENGAJUAN;
    const updated = localList.filter((p) => p.id !== id);
    safeLocalStorageSet(KEYS.PENGAJUAN, updated);
  } catch (e) {
    console.warn('Safe localStorage delete pengajuan error:', e);
  }

  // 2. Delete from Supabase Cloud if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('pengajuan_kgb').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete pengajuan error:', error);
        throw new Error(`${error.code}: ${error.message}`);
      }
    } catch (err) {
      console.warn('Supabase delete pengajuan exception:', err);
      throw err;
    }
  }

  return true;
}

// ======================== USERS REPOSITORY ========================
export async function getUsersList(): Promise<User[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw new Error(error.message);
      if (data) {
        return data.map((d) => ({
          id: d.id,
          username: d.username,
          password: d.password,
          role: d.role,
          pegawaiId: d.pegawai_id || d.pegawaiId,
          namaLengkap: d.nama_lengkap || d.namaLengkap,
          email: d.email,
          status: d.status,
          createdAt: d.created_at || d.createdAt,
          lastLogin: d.last_login || d.lastLogin,
        }));
      }
    } catch (e) {
      console.error('Supabase users fetch error:', e);
      throw e;
    }
  }

  try {
    const raw = localStorage.getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export async function saveUser(user: User): Promise<User> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        pegawai_id: user.pegawaiId,
        nama_lengkap: user.namaLengkap,
        email: user.email,
        status: user.status,
        last_login: user.lastLogin,
      };
      const { error } = await supabase.from('users').upsert(payload);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase save user error:', e);
      throw e;
    }
  }

  const current = await getUsersList();
  const index = current.findIndex((u) => u.id === user.id);
  let updated: User[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = user;
  } else {
    updated = [user, ...current];
  }
  safeLocalStorageSet(KEYS.USERS, updated);
  return user;
}

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase delete user error:', e);
      throw e;
    }
  }

  const current = await getUsersList();
  const updated = current.filter((u) => u.id !== id);
  safeLocalStorageSet(KEYS.USERS, updated);
  return true;
}

// ======================== NOTIFIKASI REPOSITORY ========================
export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      if (data) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id || d.userId,
          title: d.title,
          message: d.message,
          type: d.type,
          isRead: d.is_read ?? d.isRead ?? false,
          createdAt: d.created_at || d.createdAt,
        }));
      }
    } catch (e) {
      console.error('Supabase fetch notifikasi error:', e);
      throw e;
    }
  }

  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export async function addNotification(item: NotificationItem): Promise<void> {
  const current = await getNotifications();
  const updated = [item, ...current];
  safeLocalStorageSet(KEYS.NOTIFICATIONS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('notifikasi').insert({
        id: item.id,
        user_id: item.userId || null,
        title: item.title,
        message: item.message,
        type: item.type,
        is_read: item.isRead,
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase add notifikasi error:', e);
      throw e;
    }
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const current = await getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  safeLocalStorageSet(KEYS.NOTIFICATIONS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('notifikasi').update({ is_read: true }).eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase update notifikasi error:', e);
      throw e;
    }
  }
}

export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  const current = await getNotifications();
  const updated = current.map((n) => {
    if (!userId || n.userId === userId || !n.userId) {
      return { ...n, isRead: true };
    }
    return n;
  });
  safeLocalStorageSet(KEYS.NOTIFICATIONS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (userId) {
        const { error } = await supabase
          .from('notifikasi')
          .update({ is_read: true })
          .eq('user_id', userId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('notifikasi').update({ is_read: true });
        if (error) throw new Error(error.message);
      }
    } catch (e) {
      console.warn('Supabase markAll notifikasi error:', e);
      throw e;
    }
  }
}

// ======================== EMAIL LOGS REPOSITORY ========================
export async function getEmailLogs(): Promise<EmailDispatchLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw new Error(error.message);
      if (data) {
        return data.map((d) => ({
          id: d.id,
          toEmail: d.to_email || d.toEmail,
          toName: d.to_name || d.toName,
          subject: d.subject,
          contentSnippet: d.content_snippet || d.contentSnippet,
          status: d.status,
          pengajuanId: d.pengajuan_id || d.pengajuanId,
          noPengajuan: d.no_pengajuan || d.noPengajuan,
          timestamp: d.timestamp,
        }));
      }
    } catch (e) {
      console.error('Supabase fetch email_logs error:', e);
      throw e;
    }
  }

  try {
    const raw = localStorage.getItem(KEYS.EMAIL_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_EMAIL_LOGS;
  } catch (e) {
    return INITIAL_EMAIL_LOGS;
  }
}

export async function addEmailLog(log: EmailDispatchLog): Promise<void> {
  const current = await getEmailLogs();
  const updated = [log, ...current];
  safeLocalStorageSet(KEYS.EMAIL_LOGS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('email_logs').insert({
        id: log.id,
        to_email: log.toEmail,
        to_name: log.toName,
        subject: log.subject,
        content_snippet: log.contentSnippet,
        status: log.status,
        pengajuan_id: log.pengajuanId || null,
        no_pengajuan: log.noPengajuan || null,
        timestamp: log.timestamp,
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase add email log error:', e);
      throw e;
    }
  }
}

// ======================== TEMPLATES REPOSITORY ========================
export async function getTemplatesList(): Promise<TemplateDokumen[]> {
  try {
    const raw = localStorage.getItem(KEYS.TEMPLATES);
    if (!raw) return INITIAL_TEMPLATES;
    const parsed: TemplateDokumen[] = JSON.parse(raw);
    const defaultPengantar = INITIAL_TEMPLATES.find((template) => template.id === 'tmpl-pengantar-provinsi');
    let migrated = false;
    const currentTemplates = parsed.map((template) => {
      if (
        defaultPengantar &&
        template.id === defaultPengantar.id &&
        template.isDefault &&
        template.isiKonten.startsWith(
          'Bersama ini kami sampaikan dengan hormat kelengkapan berkas usulan Kenaikan Gaji Berkala'
        )
      ) {
        migrated = true;
        return {
          ...template,
          ...defaultPengantar,
          createdAt: template.createdAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return template;
    });
    if (migrated) safeLocalStorageSet(KEYS.TEMPLATES, currentTemplates);

    const filtered = currentTemplates.filter(
      (t) => t.kategori === 'surat_pengantar' || t.kategori === 'tanda_terima'
    );
    return filtered.length > 0 ? filtered : INITIAL_TEMPLATES;
  } catch (e) {
    return INITIAL_TEMPLATES;
  }
}

export async function saveTemplate(template: TemplateDokumen): Promise<TemplateDokumen> {
  const current = await getTemplatesList();
  const index = current.findIndex((t) => t.id === template.id);
  let updated: TemplateDokumen[];
  const itemToSave: TemplateDokumen = {
    ...template,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    updated = [...current];
    updated[index] = itemToSave;
  } else {
    updated = [itemToSave, ...current];
  }

  safeLocalStorageSet(KEYS.TEMPLATES, updated);
  return itemToSave;
}

export async function deleteTemplate(id: string): Promise<void> {
  const current = await getTemplatesList();
  const updated = current.filter((t) => t.id !== id);
  safeLocalStorageSet(KEYS.TEMPLATES, updated);
}

export async function resetTemplatesToDefault(): Promise<TemplateDokumen[]> {
  safeLocalStorageSet(KEYS.TEMPLATES, INITIAL_TEMPLATES);
  return INITIAL_TEMPLATES;
}

// ======================== KOP SURAT REPOSITORY ========================
export const DEFAULT_KOP_SURAT: KopSuratConfig = {
  namaInstansiUtama: 'BADAN PENGAWAS PEMILIHAN UMUM',
  namaInstansiSub: 'KABUPATEN SUBANG',
  unitKerja: 'SEKRETARIAT',
  alamatLengkap: 'Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
  teleponFaks: 'Telp: (0260) 417890 · Faks: (0260) 417891',
  emailWebsite: 'Laman: subang.bawaslu.go.id · Pos-el: bawaslukabsubang@gmail.com',
  kodePos: '41211',
  logoUrl: '',
  logoWidthPx: 80,
  garisKopGaya: 'ganda',
};

export function getCurrentSessionUser(): User | null {
  try {
    const raw = localStorage.getItem('sikgb_session_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function isCurrentUserAdmin(): boolean {
  const user = getCurrentSessionUser();
  return user?.role === 'admin' || user?.role === 'kasubag';
}

export function getKopSuratConfig(): KopSuratConfig {
  try {
    const raw = localStorage.getItem(KEYS.KOP_SURAT);
    if (!raw) return DEFAULT_KOP_SURAT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_KOP_SURAT, ...parsed };
  } catch (e) {
    return DEFAULT_KOP_SURAT;
  }
}

export function saveKopSuratConfig(config: KopSuratConfig, forcedIsAdmin?: boolean): KopSuratConfig {
  const isAdmin = forcedIsAdmin !== undefined ? forcedIsAdmin : isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn('Akses ditolak: Hanya admin yang dapat mengubah pengaturan kop surat.');
    return getKopSuratConfig();
  }
  const itemToSave: KopSuratConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEYS.KOP_SURAT, JSON.stringify(itemToSave));
  } catch (e) {
    console.warn('Failed to save kop surat to localStorage:', e);
  }
  return itemToSave;
}

export function resetKopSuratConfig(forcedIsAdmin?: boolean): KopSuratConfig {
  const isAdmin = forcedIsAdmin !== undefined ? forcedIsAdmin : isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn('Akses ditolak: Hanya admin yang dapat mereset kop surat.');
    return getKopSuratConfig();
  }
  try {
    localStorage.removeItem(KEYS.KOP_SURAT);
  } catch (e) {}
  return DEFAULT_KOP_SURAT;
}

// ======================== TANDA TANGAN & CAP REPOSITORY ========================
export const DEFAULT_TTD_CAP: TandaTanganCapConfig = {
  // 1. Tanda Tangan Pimpinan (Kepala Sekretariat)
  namaPejabat: 'H. TATANG KOSWARA, S.Sos., M.Si',
  jabatan: 'Kepala Sekretariat Bawaslu Kabupaten Subang',
  nip: '197405121998031002',
  kota: 'Subang',
  tandaTanganUrl: DEFAULT_TANDA_TANGAN_SVG,
  tandaTanganWidthPx: 140,
  tampilkanTandaTangan: true,
  capUrl: DEFAULT_CAP_BAWASLU_SVG,
  capWidthPx: 120,
  tampilkanCap: true,
  posisiCap: 'tumpang_kiri',
  opacityCap: 0.88,

  // 2. Tanda Tangan Admin (Kasubag Administrasi)
  adminKasubag: {
    nama: 'DIMAS EBO SUHARTONO, S.AP',
    jabatan: 'Kepala Sub Bagian Administrasi',
    nip: '199206142019031004',
    tandaTanganUrl: DEFAULT_TANDA_TANGAN_KASUBAG_SVG,
    tandaTanganWidthPx: 135,
    tampilkanTandaTangan: true,
  },

  // Format tata letak tanda tangan pada dokumen cetak (tunggal / tanpa verifikator ganda)
  modeTampilanDokumen: 'pimpinan_saja',
};

export function getTandaTanganCapConfig(): TandaTanganCapConfig {
  try {
    const raw = localStorage.getItem(KEYS.TANDA_TANGAN_CAP);
    if (!raw) return DEFAULT_TTD_CAP;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TTD_CAP,
      ...parsed,
      adminKasubag: {
        ...DEFAULT_TTD_CAP.adminKasubag,
        ...(parsed.adminKasubag || {}),
      },
      modeTampilanDokumen: 'pimpinan_saja',
    };
  } catch (e) {
    return DEFAULT_TTD_CAP;
  }
}

export function saveTandaTanganCapConfig(config: TandaTanganCapConfig, forcedIsAdmin?: boolean): TandaTanganCapConfig {
  const isAdmin = forcedIsAdmin !== undefined ? forcedIsAdmin : isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn('Akses ditolak: Hanya admin yang dapat mengubah pengaturan tanda tangan dan cap.');
    return getTandaTanganCapConfig();
  }
  const itemToSave: TandaTanganCapConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEYS.TANDA_TANGAN_CAP, JSON.stringify(itemToSave));
  } catch (e) {
    console.warn('Failed to save ttd & cap to localStorage:', e);
  }
  return itemToSave;
}

export function resetTandaTanganCapConfig(forcedIsAdmin?: boolean): TandaTanganCapConfig {
  const isAdmin = forcedIsAdmin !== undefined ? forcedIsAdmin : isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn('Akses ditolak: Hanya admin yang dapat mereset tanda tangan dan cap.');
    return getTandaTanganCapConfig();
  }
  try {
    localStorage.removeItem(KEYS.TANDA_TANGAN_CAP);
  } catch (e) {}
  return DEFAULT_TTD_CAP;
}
