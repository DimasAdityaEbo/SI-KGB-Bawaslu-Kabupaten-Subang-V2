import React from 'react';
import bawasluLogo from '../asset/logo-bawaslu.png';

interface BawasluLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BawasluLogo: React.FC<BawasluLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  };

  const textSizes = {
    sm: { title: 'text-xs', subtitle: 'text-[8px]', regional: 'text-[9px]' },
    md: { title: 'text-base sm:text-lg', subtitle: 'text-[9px] sm:text-[10px]', regional: 'text-[10px] sm:text-[11px]' },
    lg: { title: 'text-xl sm:text-2xl', subtitle: 'text-[11px] sm:text-xs', regional: 'text-xs sm:text-sm' },
    xl: { title: 'text-2xl sm:text-3xl', subtitle: 'text-xs sm:text-sm', regional: 'text-sm sm:text-base' },
  };

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      <img
        src={bawasluLogo}
        alt="Logo Bawaslu"
        className={`${iconSizes[size]} shrink-0 object-contain transition-transform`}
      />

      {/* Typography from Uploaded Identity */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-black tracking-wider uppercase text-slate-950 font-sans ${textSizes[size].title}`}
            style={{ letterSpacing: '0.04em' }}
          >
            BAWASLU
          </span>
          <span
            className={`font-medium tracking-normal text-slate-700 uppercase ${textSizes[size].subtitle}`}
          >
            BADAN PENGAWAS PEMILIHAN UMUM
          </span>
          <span
            className={`font-bold tracking-wide uppercase text-slate-900 ${textSizes[size].regional}`}
          >
            KABUPATEN SUBANG
          </span>
        </div>
      )}
    </div>
  );
};
