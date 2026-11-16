import React, { useState } from 'react';
import { X, KeyRound, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { User } from '../types';
import { saveUser } from '../services/storage';
import { showErrorDialog, showSuccessDialog } from '../services/alerts';

interface UbahPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPasswordChanged: (updatedUser: User) => void;
}

export const UbahPasswordModal: React.FC<UbahPasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current password
    if (currentPassword !== currentUser.password) {
      void showErrorDialog('Password saat ini yang Anda masukkan salah.');
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      void showErrorDialog('Password baru minimal 6 karakter.');
      return;
    }

    // Check if new password is same as current password
    if (newPassword === currentPassword) {
      void showErrorDialog('Password baru tidak boleh sama dengan password saat ini.');
      return;
    }

    // Check confirmation
    if (newPassword !== confirmPassword) {
      void showErrorDialog('Konfirmasi password baru tidak sesuai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        password: newPassword.trim(),
      };

      await saveUser(updatedUser);
      onPasswordChanged(updatedUser);
      
      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      await showSuccessDialog('Password berhasil diubah. Gunakan password baru Anda untuk login berikutnya.');
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui password:', err);
      await showErrorDialog('Gagal memperbarui password. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ubah Password Akun</h3>
              <p className="text-[11px] text-slate-500">Perbarui kata sandi akun Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Current Password */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Masukkan password lama / NIP..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-9 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-9 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Gunakan kombinasi huruf dan angka untuk keamanan optimal.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Ulangi password baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-9 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
