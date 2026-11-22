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
        // pre-fill sensible range based on page count
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
      className="fixed inset-0 m-auto p-0 bg-transparent text-[#ebdbb2] border-0 backdrop:bg-[#1d2021]/80 backdrop:backdrop-blur-sm z-50 max-w-lg w-full"
      onClose={onClose}
    >
      <div className="bg-[#282828] border border-[#504945] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3c3836]">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-[#fe8019]" />
            <h3 id="split-dialog-title" className="font-bold text-[#fbf1c7] text-base">
              Split Document
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          <p className="text-[#a89984]">
            Choose how you want to split your {totalPageCount} workspace pages:
          </p>

          {/* Option Cards */}
          <div className="flex flex-col gap-2.5">
            {/* Mode 1: All Single Pages */}
            <label
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                splitMode === 'all-pages'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021]/50 border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
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
                <div className="font-semibold text-sm text-[#fbf1c7] flex items-center gap-1.5">
                  <FileArchive className="w-4 h-4 text-[#fabd2f]" />
                  <span>Extract Every Page as a Separate PDF (ZIP)</span>
                </div>
                <div className="text-[#a89984] mt-0.5 text-xs">
                  Creates {totalPageCount} separate PDF files packaged in a single .zip download.
                </div>
              </div>
            </label>

            {/* Mode 2: By Ranges */}
            <label
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                splitMode === 'ranges'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021]/50 border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
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
                <div className="font-semibold text-sm text-[#fbf1c7] flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-[#fe8019]" />
                  <span>Split by Custom Page Ranges</span>
                </div>
                <div className="text-[#a89984] mt-0.5 text-xs">
                  Divide into multiple documents by specifying page numbers.
                </div>

                {splitMode === 'ranges' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={ranges}
                      onChange={(e) => setRanges(e.target.value)}
                      placeholder="e.g. 1-2, 3-5, 6-10"
                      className="w-full bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded-lg px-3 py-2 text-xs text-[#fbf1c7] outline-none"
                    />
                    <span className="text-[11px] text-[#7c6f64] mt-1 block">
                      Separate ranges with commas (e.g. &quot;1-3, 4-7, 8&quot;). Total pages: {totalPageCount}.
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* Mode 3: Selected Pages Only */}
            <label
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                selectedPageCount === 0 && 'opacity-50 cursor-not-allowed',
                splitMode === 'selected'
                  ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                  : 'bg-[#1d2021]/50 border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
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
                <div className="font-semibold text-sm text-[#fbf1c7] flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#b8bb26]" />
                  <span>Extract Only Selected Pages ({selectedPageCount})</span>
                </div>
                <div className="text-[#a89984] mt-0.5 text-xs">
                  {selectedPageCount > 0
                    ? `Save the ${selectedPageCount} checked pages into a standalone PDF.`
                    : 'Select pages with the checkboxes in the workspace first.'}
                </div>
              </div>
            </label>

            {/* Mode 4: By Original Document */}
            {docCount > 1 && (
              <label
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                  splitMode === 'by-document'
                    ? 'bg-[#32302f] border-[#fabd2f] text-[#fbf1c7]'
                    : 'bg-[#1d2021]/50 border-[#3c3836] hover:border-[#504945] text-[#bdae93]'
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
                  <div className="font-semibold text-sm text-[#fbf1c7] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#83a598]" />
                    <span>Split by Source Documents ({docCount} files)</span>
                  </div>
                  <div className="text-[#a89984] mt-0.5 text-xs">
                    Package each original document with all edits into a ZIP.
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#3c3836] bg-[#1d2021]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || (splitMode === 'selected' && selectedPageCount === 0)}
            onClick={handleRun}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer shadow-md transition-all',
              (isProcessing || (splitMode === 'selected' && selectedPageCount === 0)) &&
                'opacity-40 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Scissors className="w-4 h-4" />
            )}
            <span>Split & Download</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
