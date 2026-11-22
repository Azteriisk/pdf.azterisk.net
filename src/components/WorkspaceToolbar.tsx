'use client';

import React from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  Scissors,
  Hash,
  Download,
  CheckSquare,
  Square,
  FileCheck,
  Loader2,
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
  onRotateSelected: () => void;
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
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0;

  return (
    <div className="sticky top-[61px] z-20 w-full bg-[#282828] border-b border-[#3c3836] shadow-md px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left side: Filename & Add files */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-[#1d2021] border border-[#3c3836] rounded-md px-2.5 py-1 focus-within:border-[#fabd2f] transition-colors">
            <span className="text-xs text-[#a89984]">Name:</span>
            <input
              type="text"
              value={docName}
              onChange={(e) => onDocNameChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#fbf1c7] outline-none w-36 sm:w-48 placeholder-[#7c6f64]"
              placeholder="document.pdf"
            />
          </div>

          <Dropzone onFilesSelected={onFilesSelected} isCompact isLoading={isLoadingFiles} />
        </div>

        {/* Center / Actions: Selection & Page Manipulation */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Select All / None */}
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] transition-colors cursor-pointer"
            title={allSelected ? 'Deselect all pages' : 'Select all pages'}
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#fabd2f]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[#a89984]" />
            )}
            <span>
              {selectedCount > 0 ? `${selectedCount}/${totalCount}` : 'Select All'}
            </span>
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={onRotateSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] transition-colors cursor-pointer"
            title={someSelected ? 'Rotate selected 90°' : 'Rotate all pages 90°'}
          >
            <RotateCw className="w-3.5 h-3.5 text-[#83a598]" />
            <span className="hidden sm:inline">Rotate 90°</span>
          </button>

          {/* Duplicate */}
          {someSelected && (
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] transition-colors cursor-pointer"
              title="Duplicate selected pages"
            >
              <Copy className="w-3.5 h-3.5 text-[#b8bb26]" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          {/* Delete */}
          {someSelected && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#fb4934] bg-[#32302f] hover:bg-[#cc241d]/20 border border-[#fb4934]/30 transition-colors cursor-pointer"
              title="Delete selected pages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedCount})</span>
            </button>
          )}

          <div className="h-5 w-px bg-[#3c3836] hidden sm:block mx-1" />

          {/* Split modal trigger */}
          <button
            type="button"
            onClick={onOpenSplit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] transition-colors cursor-pointer"
            title="Split document into separate PDFs"
          >
            <Scissors className="w-3.5 h-3.5 text-[#fe8019]" />
            <span>Split</span>
          </button>

          {/* Page numbers trigger */}
          <button
            type="button"
            onClick={onOpenPageNumbers}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border',
              hasPageNumbersEnabled
                ? 'bg-[#fabd2f]/10 text-[#fabd2f] border-[#fabd2f]/40'
                : 'text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border-[#504945]'
            )}
            title="Configure header/footer page numbers"
          >
            <Hash className="w-3.5 h-3.5 text-[#fabd2f]" />
            <span className="hidden sm:inline">Numbers</span>
          </button>

          {/* Primary Export Button */}
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting || totalCount === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-sm',
              'bg-[#fabd2f] hover:bg-[#fabd2f]/90 text-[#1d2021] border border-[#fabd2f]',
              (isExporting || totalCount === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
