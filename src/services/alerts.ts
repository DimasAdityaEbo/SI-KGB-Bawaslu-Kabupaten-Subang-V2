import Swal from 'sweetalert2';

export const showSuccessDialog = (text: string, title = 'Berhasil') =>
  Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
  });

export const showErrorDialog = (text: string, title = 'Gagal') =>
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
  });

export const showWarningDialog = (text: string, title = 'Perhatian') =>
  Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
  });

export const confirmDialog = async (
  text: string,
  title = 'Konfirmasi',
  confirmButtonText = 'Ya, lanjutkan'
) => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export const confirmDeleteDialog = (text: string) =>
  confirmDialog(text, 'Konfirmasi hapus data', 'Ya, hapus');
