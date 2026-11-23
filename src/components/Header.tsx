'use client';

import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { PdfAsteriskIcon } from './PdfAsteriskIcon';

interface HeaderProps {
  pageCount: number;
  docCount: number;
  onReset: () => void;
}

export function Header({ pageCount, docCount, onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#3c3836] bg-[#1d2021]/95 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity with custom PDF Asterisk icon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#282828] border border-[#504945] flex items-center justify-center p-1">
            <PdfAsteriskIcon className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#fbf1c7] tracking-tight">
                pdf<span className="text-[#fabd2f]">.azterisk.net</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#282828] text-[#928374] border border-[#3c3836]">
                v1.0
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#a89984] hidden sm:block">
              Client-Side PDF Workstation
            </div>
          </div>
        </div>

        {/* Telemetry & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Security & Isolation Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[11px] font-mono text-[#8ec07c]">
            <Shield className="w-3 h-3 text-[#8ec07c]" />
            <span>SANDBOXED / ZERO NETWORK EGRESS</span>
          </div>

          {pageCount > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#282828] border border-[#3c3836] text-[11px] font-mono text-[#ebdbb2]">
              <span className="text-[#fabd2f] font-semibold">{pageCount}</span>
              <span className="text-[#7c6f64]">{pageCount === 1 ? 'PAGE' : 'PAGES'}</span>
              <span className="text-[#504945]">/</span>
              <span className="text-[#83a598] font-semibold">{docCount}</span>
              <span className="text-[#7c6f64]">{docCount === 1 ? 'DOC' : 'DOCS'}</span>
            </div>
          )}

          {docCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-[#ebdbb2] bg-[#282828] hover:bg-[#32302f] hover:border-[#665c54] border border-[#3c3836] transition-colors cursor-pointer"
              title="Clear active workspace"
            >
              <RefreshCw className="w-3 h-3 text-[#fb4934]" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
