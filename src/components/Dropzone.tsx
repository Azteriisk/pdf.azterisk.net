'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Plus, FilePlus, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
  isLoading?: boolean;
}

export function Dropzone({ onFilesSelected, isCompact = false, isLoading = false }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = '';
    }
  };

  if (isCompact) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
            'bg-[#32302f] hover:bg-[#3c3836] text-[#fabd2f] border border-[#fabd2f]/30 hover:border-[#fabd2f]',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More PDFs</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center transition-all duration-200',
        'bg-[#282828]/50 hover:bg-[#282828]/80',
        isDragOver
          ? 'border-[#fabd2f] bg-[#32302f]/80 scale-[1.01]'
          : 'border-[#504945] hover:border-[#7c6f64]'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <div className="max-w-md mx-auto flex flex-col items-center justify-center">
        <div
          className={cn(
            'w-16 h-16 sm:w-20 sm:h-20 mb-5 rounded-2xl flex items-center justify-center transition-transform',
            'bg-[#32302f] text-[#fabd2f] border border-[#504945] group-hover:scale-105',
            isDragOver && 'border-[#fabd2f] text-[#fabd2f] shadow-lg shadow-[#fabd2f]/10'
          )}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-[#fabd2f] border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-[#fbf1c7] mb-2 tracking-tight">
          {isLoading ? 'Processing PDFs...' : 'Drop PDF files here, or click to browse'}
        </h3>
        <p className="text-sm text-[#bdae93] mb-6">
          Merge multiple PDFs, split ranges, rearrange pages, delete pages, sign, and annotate.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#a89984]">
          <span className="px-2.5 py-1 rounded-full bg-[#1d2021] border border-[#3c3836]">
            📑 Merge & Split
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#1d2021] border border-[#3c3836]">
            🔀 Visual Drag & Drop
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#1d2021] border border-[#3c3836]">
            ✍️ Edit & Digital Sign
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#1d2021] border border-[#3c3836]">
            🔒 100% Private In-Browser
          </span>
        </div>
      </div>
    </div>
  );
}
