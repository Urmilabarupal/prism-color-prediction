import React from 'react';

interface PrismLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const PrismLogo: React.FC<PrismLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-base font-bold', sub: 'text-[9px]' },
    md: { icon: 'w-8 h-8', text: 'text-lg font-extrabold', sub: 'text-[10px]' },
    lg: { icon: 'w-16 h-16', text: 'text-2xl font-black', sub: 'text-xs' },
    xl: { icon: 'w-24 h-24', text: 'text-3xl font-black', sub: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Origami / Geometric paper plane icon in striking gradient red */}
      <div className={`relative ${current.icon} flex items-center justify-center drop-shadow-sm`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform -rotate-12 hover:scale-105 transition-transform"
        >
          <path
            d="M8 48L92 12L56 90L44 58L8 48Z"
            fill="url(#prismGrad1)"
          />
          <path
            d="M44 58L92 12L40 76V56L44 58Z"
            fill="url(#prismGrad2)"
          />
          <path
            d="M44 58L56 90L92 12L44 58Z"
            fill="url(#prismGrad3)"
            fillOpacity="0.85"
          />
          <defs>
            <linearGradient id="prismGrad1" x1="8" y1="12" x2="92" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4D4F" />
              <stop offset="1" stopColor="#E02424" />
            </linearGradient>
            <linearGradient id="prismGrad2" x1="40" y1="12" x2="92" y2="76" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF7875" />
              <stop offset="1" stopColor="#D91E18" />
            </linearGradient>
            <linearGradient id="prismGrad3" x1="44" y1="12" x2="92" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F5222D" />
              <stop offset="1" stopColor="#A8071A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="text-center mt-2">
          <div className={`tracking-wider uppercase ${current.text} text-[#FA3534]`}>
            PRISM
          </div>
          <div className="tracking-widest font-semibold text-[#FF4D4F] text-[11px] uppercase">
            Color Prediction
          </div>
        </div>
      )}
    </div>
  );
};
