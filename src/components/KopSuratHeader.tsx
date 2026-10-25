import React, { useState } from 'react';
import { KopSuratConfig } from '../types';
import { getKopSuratConfig } from '../services/storage';
import { BawasluLogo } from './BawasluLogo';

interface KopSuratHeaderProps {
  config?: KopSuratConfig;
  className?: string;
  isCompact?: boolean;
}

export const KopSuratHeader: React.FC<KopSuratHeaderProps> = ({
  config: propConfig,
  className = '',
  isCompact = false,
}) => {
  const config = propConfig || getKopSuratConfig();
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Border style
  const borderClass =
    config.garisKopGaya === 'tunggal'
      ? 'border-b-2 border-solid border-slate-900'
      : config.garisKopGaya === 'tebal'
      ? 'border-b-4 border-solid border-slate-900'
      : 'border-b-[3px] border-double border-slate-900';

  const logoWidth = config.logoWidthPx || (isCompact ? 60 : 80);

  return (
    <div className={`flex items-center ${borderClass} pb-4 mb-6 ${className}`}>
      {/* Logo container */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: `${Math.max(logoWidth + 10, 80)}px` }}
      >
        {config.logoUrl && !logoLoadError ? (
          <img
            src={config.logoUrl}
            alt={config.namaInstansiUtama || 'Logo Instansi'}
            style={{ width: `${logoWidth}px` }}
            className="object-contain max-h-24 transition-transform"
            onError={() => setLogoLoadError(true)}
          />
        ) : (
          <BawasluLogo size={isCompact ? 'md' : 'lg'} showText={false} />
        )}
      </div>

      {/* Agency text information */}
      <div className={`flex-1 text-center ${isCompact ? 'pr-4' : 'pr-8'}`}>
        {config.unitKerja && (
          <h4 className="font-serif text-[11px] font-semibold tracking-widest uppercase text-slate-700">
            {config.unitKerja}
          </h4>
        )}
        <h3
          className={`font-serif tracking-wider uppercase text-slate-800 font-semibold ${
            isCompact ? 'text-xs' : 'text-sm'
          }`}
        >
          {config.namaInstansiUtama || 'BADAN PENGAWAS PEMILIHAN UMUM'}
        </h3>
        <h2
          className={`font-serif tracking-wide uppercase text-slate-950 font-bold ${
            isCompact ? 'text-sm' : 'text-lg'
          }`}
        >
          {config.namaInstansiSub || 'KABUPATEN SUBANG'}
        </h2>
        {config.alamatLengkap && (
          <p
            className={`text-slate-600 mt-0.5 leading-tight ${
              isCompact ? 'text-[9.5px]' : 'text-[11px]'
            }`}
          >
            {config.alamatLengkap}
          </p>
        )}
        {(config.teleponFaks || config.emailWebsite) && (
          <p
            className={`text-slate-500 font-mono mt-0.5 leading-tight ${
              isCompact ? 'text-[8.5px]' : 'text-[10px]'
            }`}
          >
            {[config.teleponFaks, config.emailWebsite].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
};
