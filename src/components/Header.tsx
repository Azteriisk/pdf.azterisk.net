'use client';

import React from 'react';
import { FileText, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

interface HeaderProps {
  pageCount: number;
  docCount: number;
  onReset: () => void;
}

export function Header({ pageCount, docCount, onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#3c3836] bg-[#1d2021]/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#fabd2f]/15 border border-[#fabd2f]/30 text-[#fabd2f]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-[#fbf1c7] tracking-tight">
                Azterisk <span className="text-[#fabd2f]">PDF</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#3c3836] text-[#bdae93] font-mono border border-[#504945]">
                pdf.azterisk.net
              </span>
            </div>
            <p className="text-xs text-[#a89984] hidden sm:block">
              Merge, Split, Reorder & Edit PDFs — All In One Workflow
            </p>
          </div>
        </div>

        {/* Status badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#282828] border border-[#3c3836] text-xs text-[#8ec07c]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8ec07c]" />
            <span>100% Client-Side • Private & Free</span>
          </div>

          {pageCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#282828] border border-[#3c3836] text-xs text-[#d5c4a1]">
              <span className="text-[#fabd2f] font-semibold">{pageCount}</span>{' '}
              {pageCount === 1 ? 'page' : 'pages'}
              <span className="text-[#665c54]">•</span>
              <span className="text-[#83a598] font-semibold">{docCount}</span>{' '}
              {docCount === 1 ? 'doc' : 'docs'}
            </div>
          )}

          {docCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] transition-colors cursor-pointer"
              title="Clear workspace and start fresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#fb4934]" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
