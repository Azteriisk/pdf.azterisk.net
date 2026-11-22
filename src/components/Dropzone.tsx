'use client';

import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Plus, FileCode2, Lock, Cpu, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
  isLoading?: boolean;
}

export function Dropzone({ onFilesSelected, isCompact = false, isLoading = false }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files) return;
      const files = Array.from(e.clipboardData.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

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
            'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer',
            'bg-[#282828] hover:bg-[#32302f] hover:border-[#665c54] text-[#fabd2f] border border-[#3c3836]',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          title="Append more PDF files into the workspace"
        >
          <Plus className="w-3.5 h-3.5 text-[#fabd2f]" />
          <span>ADD PDFS</span>
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
        'relative cursor-pointer rounded-xl border border-dashed transition-all p-8 sm:p-12 text-center',
        'bg-[#282828] hover:bg-[#282828]/90',
        isDragOver
          ? 'border-[#fabd2f] bg-[#32302f] ring-1 ring-[#fabd2f]'
          : 'border-[#504945] hover:border-[#665c54]'
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

      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Terminal/Technical Icon */}
        <div
          className={cn(
            'w-14 h-14 mb-4 rounded-lg flex items-center justify-center border transition-colors',
            'bg-[#1d2021] text-[#fabd2f] border-[#3c3836]',
            isDragOver ? 'border-[#fabd2f]' : 'group-hover:border-[#504945]'
          )}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-[#fabd2f] border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7 text-[#fabd2f]" />
          )}
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#fbf1c7] font-mono tracking-tight mb-1">
          {isLoading ? 'Parsing Document Structure...' : 'Drop PDF files here to initialize session'}
        </h2>
        <p className="text-xs text-[#a89984] font-mono mb-6">
          Click to browse local files or paste bytes directly from clipboard (Ctrl+V)
        </p>

        {/* Technical Specification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-left">
          <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#fe8019] mb-1">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>SPECIFICATION</span>
            </div>
            <div className="text-[11px] font-mono text-[#ebdbb2]">
              ISO 32000-1 / 32000-2
            </div>
            <div className="text-[10px] text-[#928374] font-mono">
              Merge, split & byte edit
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#83a598] mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>PIPELINE</span>
            </div>
            <div className="text-[11px] font-mono text-[#ebdbb2]">
              Worker-Thread Canvas
            </div>
            <div className="text-[10px] text-[#928374] font-mono">
              Vector & bitmap rendering
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#1d2021] border border-[#3c3836]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8ec07c] mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>ISOLATION</span>
            </div>
            <div className="text-[11px] font-mono text-[#ebdbb2]">
              Local Memory Only
            </div>
            <div className="text-[10px] text-[#928374] font-mono">
              Zero telemetry or uploads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
