import React from 'react';
import { X, Bell, Check, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div className="mt-14 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Notifikasi SI-KGB</h3>
            <span className="font-mono-numbers rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {notifications.filter((n) => !n.isRead).length} Belum Dibaca
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
            >
              Tandai Semua
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada notifikasi saat ini.
            </div>
          ) : (
            notifications.map((notif) => {
              const getIcon = () => {
                switch (notif.type) {
                  case 'success':
                    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
                  case 'warning':
                    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
                  case 'alert':
                    return <AlertOctagon className="h-4 w-4 text-red-600" />;
                  default:
                    return <Info className="h-4 w-4 text-sky-600" />;
                }
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`cursor-pointer rounded-lg p-3 text-left transition ${
                    notif.isRead
                      ? 'bg-white opacity-70 hover:opacity-100'
                      : 'bg-sky-50/50 hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getIcon()}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs ${
                            notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-500">
          Notifikasi terhubung secara real-time ke email pemohon.
        </div>
      </div>
    </div>
  );
};
