import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText, CheckCircle2, ShieldCheck, Eye, ExternalLink } from 'lucide-react';
import { DokumenLampiran, PengajuanKGB } from '../types';
import { getOrGenerateDocumentUrl, downloadDokumenFile } from '../services/documentUtils';
import { getDocumentBinary } from '../services/idbStorage';
import { BawasluLogo } from './BawasluLogo';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DokumenLampiran | null;
  pengajuan?: PengajuanKGB;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  pengajuan,
}) => {
  const [asyncDataUrl, setAsyncDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!document) {
      setAsyncDataUrl(null);
      return;
    }
    if (document.fileData && document.fileData.startsWith('data:')) {
      setAsyncDataUrl(document.fileData);
      return;
    }
    getDocumentBinary(document.id)
      .then((bin) => {
        if (bin) {
          setAsyncDataUrl(bin);
        } else {
          setAsyncDataUrl(getOrGenerateDocumentUrl(document, pengajuan));
        }
      })
      .catch(() => {
        setAsyncDataUrl(getOrGenerateDocumentUrl(document, pengajuan));
      });
  }, [document, pengajuan]);

  if (!isOpen || !document) return null;

  const dataUrl = asyncDataUrl || getOrGenerateDocumentUrl(document, pengajuan);
  const isImage =
    document.tipeFile?.startsWith('image/') ||
    document.namaFile.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ||
    dataUrl.startsWith('data:image/');
  const isPdf =
    document.tipeFile === 'application/pdf' ||
    document.namaFile.match(/\.pdf$/i) ||
    dataUrl.startsWith('data:application/pdf');

  const handleDownload = () => {
    downloadDokumenFile(document, pengajuan);
  };

  const handlePrint = () => {
    // Avoid window.open which is blocked inside iframes
    const iframe = window.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    window.document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.namaFile} - Bawaslu Subang</title>
          <style>
            @page { margin: 10mm; }
            body { margin: 0; padding: 20px; font-family: sans-serif; display: flex; justify-content: center; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      } finally {
        setTimeout(() => {
          if (window.document.body.contains(iframe)) {
            window.document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  };

  const getDocBadgeLabel = () => {
    switch (document.jenisDokumen) {
      case 'sk_pangkat':
        return 'SK Kenaikan Pangkat Terakhir';
      case 'sk_kgb':
        return 'SK KGB Periode Sebelumnya';
      case 'skp_prestasi':
        return 'Dokumen Penilaian SKP (2 Tahun)';
      default:
        return 'Dokumen Lampiran Kepegawaian';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex h-[94vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <BawasluLogo size="sm" showText={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {document.namaFile}
                </h3>
                <span className="hidden sm:inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                  {getDocBadgeLabel()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Ukuran: {document.ukuranFile} · Pemohon: {pengajuan?.namaPemohon || 'Pegawai Bawaslu'} (NIP: {pengajuan?.nipPemohon || '-'})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              title="Unduh Berkas ke Komputer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh Berkas</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Cetak Berkas"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Tutup Pratinjau"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Preview Viewport */}
        <div className="flex-1 overflow-auto bg-slate-100/80 p-4 sm:p-6 flex items-center justify-center">
          {isImage ? (
            <div className="max-w-3xl rounded-xl bg-white p-3 shadow-lg border border-slate-200">
              <img
                src={dataUrl}
                alt={document.namaFile}
                className="max-h-[75vh] w-auto mx-auto object-contain rounded"
              />
            </div>
          ) : isPdf && dataUrl.startsWith('data:application/pdf') ? (
            <iframe
              src={dataUrl}
              title={document.namaFile}
              className="h-full w-full rounded-xl border border-slate-300 bg-white shadow-md"
            />
          ) : (
            /* SVG Archive representation or fallback */
            <div className="max-w-3xl rounded-xl bg-white p-3 shadow-lg border border-slate-200">
              <img
                src={dataUrl}
                alt={document.namaFile}
                className="max-h-[75vh] w-auto mx-auto object-contain rounded"
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-slate-200 bg-white px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Penyimpanan Aman Digital · Terverifikasi Sistem SI-KGB Bawaslu Subang</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Format: {document.tipeFile} · Diunggah: {new Date(document.uploadedAt).toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};
