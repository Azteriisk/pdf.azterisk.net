'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Scissors, Layers, CheckSquare, FileArchive, Loader2 } from 'lucide-react';
import { SplitOptions } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPageCount: number;
  selectedPageCount: number;
  docCount: number;
  onExecuteSplit: (options: SplitOptions) => Promise<void>;
}

export function SplitModal({
  isOpen,
  onClose,
  totalPageCount,
  selectedPageCount,
  docCount,
  onExecuteSplit,
}: SplitModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [splitMode, setSplitMode] = useState<SplitOptions['mode']>('all-pages');
  const [ranges, setRanges] = useState<string>('1-2, 3-4');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        if (totalPageCount > 2) {
          const half = Math.floor(totalPageCount / 2);
          setRanges(`1-${half}, ${half + 1}-${totalPageCount}`);
        } else {
          setRanges(`1, 2`);
        }
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, totalPageCount]);

  const handleRun = async () => {
    setIsProcessing(true);
    try {
      await onExecuteSplit({
        mode: splitMode,
        ranges: splitMode === 'ranges' ? ranges : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to split:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="split-dialog-title"
      className="fixed inset-0 m-auto p-0 bg-transparent text-[#ebdbb2] border-0 backdrop:bg-[#1d2021]/80 backdrop:backdrop-blur-sm z-50 max-w-lg w-full font-mono text-xs"
      onClose={onClose}
    >
      <div className="bg-[#282828] border border-[#504945] rounded shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c3836] bg-[#1d2021]">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#fe8019]" />
            <span id="split-dialog-title" className="font-bold text-[#fbf1c7] text-xs">
              DOCUMENT EXTRACTION & SPLIT PIPELINE
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          <div className="text-[11px] text-[#928374]">
            Select target partitioning mode for {totalPageCount} workspace pages:
          </div>

          <div className="flex flex-col gap-2">
            {/* Mode 1: All Single Pages */}
            <label
              className={cn(
                'flex items-start gap-2.5 p-3 rounded border cursor-pointer transition-all',
                splitMode === 'all-pages'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
              )}
            >
              <input
                type="radio"
                name="splitMode"
                checked={splitMode === 'all-pages'}
                onChange={() => setSplitMode('all-pages')}
                className="mt-0.5 accent-[#fabd2f]"
              />
              <div className="flex-1">
                <div className="font-bold text-xs text-[#fbf1c7] flex items-center gap-1.5">
                  <FileArchive className="w-3.5 h-3.5 text-[#fabd2f]" />
                  <span>BURST ALL PAGES (ZIP ARCHIVE)</span>
                </div>
                <div className="text-[#a89984] text-[11px] mt-0.5">
                  Generates {totalPageCount} individual PDF files packed into a single zip.
                </div>
              </div>
            </label>

            {/* Mode 2: By Ranges */}
            <label
              className={cn(
                'flex items-start gap-2.5 p-3 rounded border cursor-pointer transition-all',
                splitMode === 'ranges'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
              )}
            >
              <input
                type="radio"
                name="splitMode"
                checked={splitMode === 'ranges'}
                onChange={() => setSplitMode('ranges')}
                className="mt-0.5 accent-[#fabd2f]"
              />
              <div className="flex-1">
                <div className="font-bold text-xs text-[#fbf1c7] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#fe8019]" />
                  <span>SPLIT BY PAGE RANGES</span>
                </div>
                <div className="text-[#a89984] text-[11px] mt-0.5">
                  Specify comma-separated intervals to create partitioned documents.
                </div>

                {splitMode === 'ranges' && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={ranges}
                      onChange={(e) => setRanges(e.target.value)}
                      placeholder="e.g. 1-2, 3-5, 6-10"
                      className="w-full bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded px-2.5 py-1.5 text-xs text-[#fbf1c7] outline-none font-mono"
                    />
                    <span className="text-[10px] text-[#7c6f64] mt-1 block">
                      Range syntax: &quot;1-3, 4-7, 8&quot;. Bounds: 1..{totalPageCount}.
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* Mode 3: Selected Pages */}
            <label
              className={cn(
                'flex items-start gap-2.5 p-3 rounded border cursor-pointer transition-all',
                selectedPageCount === 0 && 'opacity-40 cursor-not-allowed',
                splitMode === 'selected'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
              )}
            >
              <input
                type="radio"
                name="splitMode"
                disabled={selectedPageCount === 0}
                checked={splitMode === 'selected'}
                onChange={() => setSplitMode('selected')}
                className="mt-0.5 accent-[#fabd2f]"
              />
              <div className="flex-1">
                <div className="font-bold text-xs text-[#fbf1c7] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#b8bb26]" />
                  <span>EXTRACT CHECKED PAGES ({selectedPageCount})</span>
                </div>
                <div className="text-[#a89984] text-[11px] mt-0.5">
                  {selectedPageCount > 0
                    ? `Save the ${selectedPageCount} currently selected pages as a single PDF.`
                    : 'No pages currently selected in the grid.'}
                </div>
              </div>
            </label>

            {/* Mode 4: By Document */}
            {docCount > 1 && (
              <label
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded border cursor-pointer transition-all',
                  splitMode === 'by-document'
                    ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                    : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
                )}
              >
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitMode === 'by-document'}
                  onChange={() => setSplitMode('by-document')}
                  className="mt-0.5 accent-[#fabd2f]"
                />
                <div className="flex-1">
                  <div className="font-bold text-xs text-[#fbf1c7] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#83a598]" />
                    <span>SPLIT BY INGESTION SOURCE ({docCount} FILES)</span>
                  </div>
                  <div className="text-[#a89984] text-[11px] mt-0.5">
                    Package each source file with all edits applied into a ZIP archive.
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#3c3836] bg-[#1d2021]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded text-xs text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={isProcessing || (splitMode === 'selected' && selectedPageCount === 0)}
            onClick={handleRun}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer transition-all',
              (isProcessing || (splitMode === 'selected' && selectedPageCount === 0)) &&
                'opacity-40 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Scissors className="w-3.5 h-3.5" />
            )}
            <span>EXECUTE SPLIT</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
