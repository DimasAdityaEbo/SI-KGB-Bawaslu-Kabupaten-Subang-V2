import React, { useState, useEffect } from 'react';
import { TandaTanganCapConfig } from '../types';
import { getTandaTanganCapConfig } from '../services/storage';

interface TandaTanganCapBlockProps {
  config?: TandaTanganCapConfig;
  tanggalText?: string;
  customNamaPejabat?: string;
  customJabatan?: string;
  customNip?: string;
  customKota?: string;
  align?: 'left' | 'center' | 'right';
  isCompact?: boolean;
  className?: string;
  hideCap?: boolean;
  hideSignature?: boolean;

  // Dual Signatures support
  mode?: 'auto' | 'dua_pejabat' | 'pimpinan_saja' | 'admin_saja';
  showDualSignatures?: boolean;
  leftTitle?: string;
  rightTitle?: string;
}

export const TandaTanganCapBlock: React.FC<TandaTanganCapBlockProps> = ({
  config: propsConfig,
  tanggalText,
  customNamaPejabat,
  customJabatan,
  customNip,
  customKota,
  align = 'right',
  isCompact = false,
  className = '',
  hideCap = false,
  hideSignature = false,
  mode = 'auto',
  showDualSignatures,
  leftTitle,
  rightTitle,
}) => {
  const [internalConfig, setInternalConfig] = useState<TandaTanganCapConfig>(() =>
    propsConfig || getTandaTanganCapConfig()
  );

  useEffect(() => {
    if (propsConfig) {
      setInternalConfig(propsConfig);
    } else {
      setInternalConfig(getTandaTanganCapConfig());
    }
  }, [propsConfig]);

  const cfg = propsConfig || internalConfig;

  // Pimpinan data
  const namaPimpinan = customNamaPejabat || cfg.namaPejabat;
  const jabatanPimpinan = customJabatan || cfg.jabatan;
  const nipPimpinan = customNip || cfg.nip;
  const kota = customKota || cfg.kota || 'Subang';

  // Admin / Kasubag data
  const kasubag = cfg.adminKasubag || {
    nama: 'DIMAS EBO SUHARTONO, S.AP',
    jabatan: 'Kepala Sub Bagian Administrasi',
    nip: '199206142019031004',
    tandaTanganUrl: '',
    tandaTanganWidthPx: 135,
    tampilkanTandaTangan: true,
  };

  const defaultDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tanggal = tanggalText || cfg.tanggalText || defaultDate;

  // Determine effective display mode
  const effectiveMode =
    showDualSignatures !== undefined
      ? showDualSignatures
        ? 'dua_pejabat'
        : 'pimpinan_saja'
      : mode !== 'auto'
      ? mode
      : cfg.modeTampilanDokumen || 'pimpinan_saja';

  const showPimpinanTtd = !hideSignature && cfg.tampilkanTandaTangan && !!cfg.tandaTanganUrl;
  const showCap = !hideCap && cfg.tampilkanCap && !!cfg.capUrl;
  const pimpinanTtdWidth = cfg.tandaTanganWidthPx || 140;
  const capWidth = cfg.capWidthPx || 120;
  const capOpacity = cfg.opacityCap ?? 0.88;

  const showKasubagTtd = kasubag.tampilkanTandaTangan && !!kasubag.tandaTanganUrl;
  const kasubagTtdWidth = kasubag.tandaTanganWidthPx || 135;

  // ===================== DUAL SIGNATURES (KASUBAG & PIMPINAN) =====================
  if (effectiveMode === 'dua_pejabat') {
    return (
      <div className={`w-full my-4 print-break-inside-avoid ${className}`}>
        <div className="grid grid-cols-2 gap-4 sm:gap-8 items-end text-center">
          {/* Kolom Kiri: Admin / Kasubag Administrasi */}
          <div className="flex flex-col items-center justify-end text-xs leading-snug">
            <p className="text-slate-700 font-medium">
              {leftTitle || 'Diverifikasi Oleh:'}
            </p>
            <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line min-h-[32px] flex items-center justify-center">
              {kasubag.jabatan || 'Kepala Sub Bagian Administrasi'}
            </p>

            {/* Visual Tanda Tangan Kasubag */}
            <div className="relative my-2 min-h-[80px] w-full flex items-center justify-center select-none overflow-visible">
              {showKasubagTtd ? (
                <div
                  className="relative z-10 shrink-0 pointer-events-none"
                  style={{ width: `${kasubagTtdWidth}px` }}
                >
                  <img
                    src={kasubag.tandaTanganUrl}
                    alt={`Tanda Tangan ${kasubag.nama}`}
                    className="w-full h-auto max-h-20 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                  [Tanda Tangan Kasubag]
                </div>
              )}
            </div>

            {/* Nama & NIP Kasubag */}
            <p className="font-bold underline text-slate-950 uppercase tracking-wide">
              {kasubag.nama}
            </p>
            {kasubag.nip && (
              <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                NIP. {kasubag.nip}
              </p>
            )}
          </div>

          {/* Kolom Kanan: Pimpinan Bawaslu + Cap Dinas */}
          <div className="flex flex-col items-center justify-end text-xs leading-snug">
            <p className="text-slate-800">
              {kota}, {tanggal}
            </p>
            <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line min-h-[32px] flex items-center justify-center">
              {rightTitle || jabatanPimpinan}
            </p>

            {/* Visual Tanda Tangan Pimpinan + Cap */}
            <div className="relative my-2 min-h-[80px] w-full flex items-center justify-center select-none overflow-visible">
              {showPimpinanTtd || showCap ? (
                <div className="relative flex items-center justify-center">
                  {/* Cap: sebelah kiri */}
                  {showCap && cfg.posisiCap === 'sebelah_kiri' && (
                    <div
                      className="mr-2 shrink-0 pointer-events-none"
                      style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                    >
                      <img src={cfg.capUrl} alt="Cap Dinas" className="w-full h-auto object-contain" />
                    </div>
                  )}

                  {/* TTD Pimpinan */}
                  {showPimpinanTtd && (
                    <div
                      className="relative z-10 shrink-0 pointer-events-none"
                      style={{ width: `${pimpinanTtdWidth}px` }}
                    >
                      <img
                        src={cfg.tandaTanganUrl}
                        alt="Tanda Tangan Pimpinan"
                        className="w-full h-auto max-h-20 object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Cap: tumpang tindih resmi */}
                  {showCap && cfg.posisiCap === 'tumpang_kiri' && (
                    <div
                      className="absolute pointer-events-none z-20"
                      style={{
                        width: `${capWidth}px`,
                        left: showPimpinanTtd ? '-24px' : '50%',
                        top: '50%',
                        transform: showPimpinanTtd ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                        opacity: capOpacity,
                        mixBlendMode: 'multiply',
                      }}
                    >
                      <img src={cfg.capUrl} alt="Cap Bawaslu" className="w-full h-auto object-contain" />
                    </div>
                  )}

                  {/* Cap: sebelah kanan */}
                  {showCap && cfg.posisiCap === 'sebelah_kanan' && (
                    <div
                      className="ml-2 shrink-0 pointer-events-none"
                      style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                    >
                      <img src={cfg.capUrl} alt="Cap Dinas" className="w-full h-auto object-contain" />
                    </div>
                  )}
                </div>
              ) : !hideSignature ? (
                <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                  {hideCap ? '[Tanda Tangan Digital]' : '[Tanda Tangan & Cap Digital]'}
                </div>
              ) : null}
            </div>

            {/* Nama & NIP Pimpinan */}
            <p className="font-bold underline text-slate-950 uppercase tracking-wide">
              {namaPimpinan}
            </p>
            {nipPimpinan && (
              <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                NIP. {nipPimpinan}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== SINGLE SIGNATURE (ADMIN / KASUBAG SAJA) =====================
  if (effectiveMode === 'admin_saja') {
    const alignContainerClass =
      align === 'left'
        ? 'justify-start text-left'
        : align === 'center'
        ? 'justify-center text-center'
        : 'justify-end text-center';

    return (
      <div className={`flex ${alignContainerClass} ${className} print-break-inside-avoid`}>
        <div className={`text-center ${isCompact ? 'w-56 text-[11px]' : 'w-72 text-xs'} leading-snug`}>
          <p className="text-slate-800">
            {kota}, {tanggal}
          </p>
          <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line">
            {kasubag.jabatan}
          </p>

          <div className="relative my-2 min-h-[85px] flex items-center justify-center select-none overflow-visible">
            {showKasubagTtd ? (
              <div
                className="relative z-10 shrink-0 pointer-events-none"
                style={{ width: `${kasubagTtdWidth}px` }}
              >
                <img
                  src={kasubag.tandaTanganUrl}
                  alt={`Tanda Tangan ${kasubag.nama}`}
                  className="w-full h-auto max-h-24 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                [Tanda Tangan Kasubag Administrasi]
              </div>
            )}
          </div>

          <p className="font-bold underline text-slate-950 uppercase tracking-wide">
            {kasubag.nama}
          </p>
          {kasubag.nip && (
            <p className="font-mono text-[11px] text-slate-600 mt-0.5">
              NIP. {kasubag.nip}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ===================== SINGLE SIGNATURE (PIMPINAN + CAP) =====================
  const alignContainerClass =
    align === 'left'
      ? 'justify-start text-left'
      : align === 'center'
      ? 'justify-center text-center'
      : 'justify-end text-center';

  return (
    <div className={`flex ${alignContainerClass} ${className} print-break-inside-avoid`}>
      <div className={`text-center ${isCompact ? 'w-56 text-[11px]' : 'w-72 text-xs'} leading-snug`}>
        {/* Tanggal & Tempat */}
        <p className="text-slate-800">
          {kota}, {tanggal}
        </p>

        {/* Jabatan Pejabat */}
        <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line">
          {jabatanPimpinan}
        </p>

        {/* Container Visual Tanda Tangan & Cap */}
        <div className="relative my-2 min-h-[85px] flex items-center justify-center overflow-visible select-none">
          {showPimpinanTtd || showCap ? (
            <div className="relative flex items-center justify-center">
              {/* Posisi Cap: Sebelah Kiri */}
              {showCap && cfg.posisiCap === 'sebelah_kiri' && (
                <div
                  className="mr-2 shrink-0 pointer-events-none"
                  style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Tanda Tangan */}
              {showPimpinanTtd && (
                <div
                  className="relative z-10 shrink-0 pointer-events-none"
                  style={{ width: `${pimpinanTtdWidth}px` }}
                >
                  <img
                    src={cfg.tandaTanganUrl}
                    alt="Tanda Tangan Pejabat"
                    className="w-full h-auto max-h-24 object-contain"
                  />
                </div>
              )}

              {/* Posisi Cap: Tumpang Tindih (Standar Resmi Tata Naskah Dinas RI) */}
              {showCap && cfg.posisiCap === 'tumpang_kiri' && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    width: `${capWidth}px`,
                    left: showPimpinanTtd ? '-28px' : '50%',
                    top: '50%',
                    transform: showPimpinanTtd ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                    opacity: capOpacity,
                    mixBlendMode: 'multiply',
                  }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas Bawaslu"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Posisi Cap: Sebelah Kanan */}
              {showCap && cfg.posisiCap === 'sebelah_kanan' && (
                <div
                  className="ml-2 shrink-0 pointer-events-none"
                  style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Jika hanya Cap tanpa Tanda Tangan dan mode bukan tumpang */}
              {!showPimpinanTtd && showCap && cfg.posisiCap !== 'tumpang_kiri' && (
                <div
                  className="pointer-events-none"
                  style={{ width: `${capWidth}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
              [Tanda Tangan &amp; Cap Digital]
            </div>
          )}
        </div>

        {/* Nama Pejabat */}
        <p className="font-bold underline text-slate-950 uppercase tracking-wide">
          {namaPimpinan}
        </p>

        {/* NIP Pejabat */}
        {nipPimpinan && (
          <p className="font-mono text-[11px] text-slate-600 mt-0.5">
            NIP. {nipPimpinan}
          </p>
        )}
      </div>
    </div>
  );
};
