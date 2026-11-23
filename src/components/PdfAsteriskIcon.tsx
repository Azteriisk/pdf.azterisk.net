import React from 'react';

interface PdfAsteriskIconProps {
  className?: string;
  size?: number;
}

export function PdfAsteriskIcon({ className = 'w-6 h-6', size }: PdfAsteriskIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Document Body with Folded Corner */}
      <path
        d="M6 4C6 2.89543 6.89543 2 8 2H20L26 8V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z"
        fill="#282828"
        stroke="#504945"
        strokeWidth="1.5"
      />
      {/* Folded Corner Flap */}
      <path
        d="M20 2V7C20 7.55228 20.4477 8 21 8H26L20 2Z"
        fill="#3c3836"
        stroke="#504945"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* PDF Badge Strip (Gruvbox Red) */}
      <rect x="5.5" y="16" width="13" height="7" rx="1.5" fill="#cc241d" />
      <text
        x="12"
        y="21.2"
        fill="#fbf1c7"
        fontSize="5"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        PDF
      </text>

      {/* Azterisk 6-Point Star / Asterisk symbol (Gruvbox Golden Yellow #fabd2f) */}
      <g transform="translate(19.5, 19.5)">
        {/* Six radial bars for crisp asterisk */}
        <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#fabd2f" strokeWidth="1.8" strokeLinecap="round" />
        <line
          x1="-4.76"
          y1="-2.75"
          x2="4.76"
          y2="2.75"
          stroke="#fabd2f"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="-4.76"
          y1="2.75"
          x2="4.76"
          y2="-2.75"
          stroke="#fabd2f"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Core highlight dot */}
        <circle cx="0" cy="0" r="1.1" fill="#fbf1c7" />
      </g>
    </svg>
  );
}
