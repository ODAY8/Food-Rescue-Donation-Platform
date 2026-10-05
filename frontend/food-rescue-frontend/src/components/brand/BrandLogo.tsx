import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  variant?: 'light' | 'dark';
  clickable?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 26, text: 'text-base', gap: 'gap-2' },
  md: { icon: 34, text: 'text-lg', gap: 'gap-2.5' },
  lg: { icon: 44, text: 'text-xl', gap: 'gap-3' },
  xl: { icon: 56, text: 'text-2xl', gap: 'gap-3.5' },
};

export const BrandIcon: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="brandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1b4332" />
        <stop offset="100%" stopColor="#2d6a4f" />
      </linearGradient>
      <linearGradient id="brandLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#74c69d" />
        <stop offset="100%" stopColor="#40916c" />
      </linearGradient>
      <linearGradient id="brandHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f4a261" />
        <stop offset="100%" stopColor="#e76f51" />
      </linearGradient>
      <filter id="brandShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Squircle container with soft rounded corners */}
    <rect width="64" height="64" rx="16" fill="url(#brandBgGrad)" />
    <rect x="2" y="2" width="60" height="60" rx="14" stroke="#52b788" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />

    <g filter="url(#brandShadow)">
      {/* Caring rescue hand/cradle */}
      <path 
        d="M16 38 C 16 46, 26 51, 33 49 C 39 47.5, 46 43, 49 37 C 49.8 35.4, 48.2 33.8, 46.5 34.6 C 43.5 36, 38.5 38.5, 33 38 C 28 37.5, 23.5 34.5, 20.8 31.8 C 19.2 30.2, 16 31.5, 16 33.8 Z" 
        fill="url(#brandHandGrad)" 
      />
      <path 
        d="M17.5 32 C 14.5 28, 16 23, 21 21 C 24 19.8, 27 21.5, 28.5 24 C 29.2 25.2, 28.2 26.8, 26.8 26.5 C 24 25.8, 21.5 27.2, 19.5 30 Z" 
        fill="url(#brandHandGrad)" 
        opacity="0.9"
      />

      {/* Sprout leaf */}
      <path 
        d="M32 12 C 43 14, 48 24, 46 34 C 41 37, 32 37, 28 32 C 26 29, 26.5 21, 32 12 Z" 
        fill="url(#brandLeafGrad)" 
      />
      <path 
        d="M28 24 C 22 25, 20 31, 23 37 C 26 38, 30 36, 31 33 C 32 30, 31 26, 28 24 Z" 
        fill="#52b788" 
        opacity="0.85"
      />
      {/* Leaf highlight vein */}
      <path 
        d="M30 34 C 33 28, 37 21, 44 16" 
        stroke="#d8f3dc" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.8"
      />
    </g>
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  withText = true,
  variant = 'dark',
  clickable = true,
  className = '',
}) => {
  const cfg = SIZES[size];
  const isLight = variant === 'light';

  const content = (
    <div className={`inline-flex items-center ${cfg.gap} ${className}`}>
      <BrandIcon size={cfg.icon} />
      {withText && (
        <span className={`font-bold tracking-tight ${cfg.text} select-none`}>
          <span className={isLight ? 'text-white' : 'text-[#1b4332]'}>Food</span>
          <span className={isLight ? 'text-[#74c69d]' : 'text-[#2d6a4f]'}>Rescue</span>
          <span className="text-[#e76f51] inline-block ml-0.5">.</span>
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
