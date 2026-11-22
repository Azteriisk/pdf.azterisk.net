'use client';

import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  Scissors,
  Hash,
  Download,
  CheckSquare,
  Square,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Dropzone } from './Dropzone';
import { cn } from '@/lib/utils';

interface WorkspaceToolbarProps {
  docName: string;
  onDocNameChange: (name: string) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onRotateSelected: (direction?: 'cw' | 'ccw') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onOpenSplit: () => void;
  onOpenPageNumbers: () => void;
  onExport: () => void;
  onFilesSelected: (files: File[]) => void;
  isExporting: boolean;
  isLoadingFiles: boolean;
  hasPageNumbersEnabled?: boolean;
}

export function WorkspaceToolbar({
  docName,
  onDocNameChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onSelectOdd,
  onSelectEven,
  onRotateSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onOpenSplit,
  onOpenPageNumbers,
  onExport,
  onFilesSelected,
  isExporting,
  isLoadingFiles,
  hasPageNumbersEnabled = false,
}: WorkspaceToolbarProps) {
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0;

  return (
    <div className="sticky top-[53px] z-20 w-full bg-[#282828] border-b border-[#3c3836] px-4 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left: Document Target Filename & File Ingestion */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#1d2021] border border-[#3c3836] rounded px-2.5 py-1 focus-within:border-[#fabd2f] transition-colors">
            <span className="text-[11px] font-mono text-[#928374] mr-1.5 select-none">FILE:</span>
            <input
              type="text"
              value={docName}
              onChange={(e) => onDocNameChange(e.target.value)}
              className="bg-transparent text-xs font-mono text-[#fbf1c7] outline-none w-36 sm:w-48 placeholder-[#665c54]"
              placeholder="document.pdf"
            />
          </div>

          <Dropzone onFilesSelected={onFilesSelected} isCompact isLoading={isLoadingFiles} />
        </div>

        {/* Center/Right: Functional Operations */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {/* Select dropdown / Toggle */}
          <div className="relative">
            <div className="flex items-center rounded bg-[#1d2021] border border-[#3c3836]">
              <button
                type="button"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="flex items-center gap-1.5 px-2 py-1 text-[#ebdbb2] hover:bg-[#32302f] transition-colors cursor-pointer"
                title={allSelected ? 'Deselect all (Esc)' : 'Select all (Ctrl+A)'}
              >
                {allSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#fabd2f]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#928374]" />
                )}
                <span>
                  {selectedCount > 0 ? `${selectedCount}/${totalCount}` : 'SELECT'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowSelectMenu((v) => !v)}
                className="px-1 py-1 border-l border-[#3c3836] text-[#928374] hover:text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Select submenu */}
            {showSelectMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowSelectMenu(false)}
                />
                <div className="absolute left-0 mt-1 z-40 bg-[#1d2021] border border-[#504945] rounded shadow-xl py-1 w-36 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAll();
                      setShowSelectMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeselectAll();
                      setShowSelectMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectOdd();
                      setShowSelectMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                  >
                    Select Odd Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEven();
                      setShowSelectMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                  >
                    Select Even Pages
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Rotate Group */}
          <div className="flex items-center rounded bg-[#1d2021] border border-[#3c3836] overflow-hidden">
            <button
              type="button"
              onClick={() => onRotateSelected('cw')}
              className="flex items-center gap-1 px-2 py-1 text-[#83a598] hover:bg-[#32302f] transition-colors cursor-pointer"
              title="Rotate 90° Clockwise (R)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">90° CW</span>
            </button>
            <button
              type="button"
              onClick={() => onRotateSelected('ccw')}
              className="px-1.5 py-1 text-[#83a598] border-l border-[#3c3836] hover:bg-[#32302f] transition-colors cursor-pointer"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Duplicate */}
          {someSelected && (
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#1d2021] hover:bg-[#32302f] border border-[#3c3836] text-[#b8bb26] transition-colors cursor-pointer"
              title="Duplicate selected pages (D)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DUPLICATE</span>
            </button>
          )}

          {/* Delete */}
          {someSelected && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#1d2021] hover:bg-[#cc241d]/20 border border-[#fb4934]/40 text-[#fb4934] transition-colors cursor-pointer"
              title="Delete selected pages (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE ({selectedCount})</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#3c3836] hidden sm:block mx-0.5" />

          {/* Split modal trigger */}
          <button
            type="button"
            onClick={onOpenSplit}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1d2021] hover:bg-[#32302f] border border-[#3c3836] text-[#fe8019] transition-colors cursor-pointer"
            title="Split document into separate PDFs"
          >
            <Scissors className="w-3.5 h-3.5 text-[#fe8019]" />
            <span>SPLIT</span>
          </button>

          {/* Page numbers trigger */}
          <button
            type="button"
            onClick={onOpenPageNumbers}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer',
              hasPageNumbersEnabled
                ? 'bg-[#fabd2f]/15 text-[#fabd2f] border-[#fabd2f]/40 font-semibold'
                : 'bg-[#1d2021] hover:bg-[#32302f] border-[#3c3836] text-[#ebdbb2]'
            )}
            title="Configure header/footer page numbers"
          >
            <Hash className="w-3.5 h-3.5 text-[#fabd2f]" />
            <span className="hidden sm:inline">NUMBERS</span>
          </button>

          {/* Primary Compile & Export Action */}
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting || totalCount === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer',
              'bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] border border-[#fabd2f]',
              (isExporting || totalCount === 0) && 'opacity-40 cursor-not-allowed'
            )}
            title="Compile and export PDF (Ctrl+S)"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
