'use client';

import React, { useRef, useEffect } from 'react';
import { X, Hash, Check } from 'lucide-react';
import { PageNumberingOptions } from '@/lib/types';

interface PageNumberingModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PageNumberingOptions;
  onChange: (options: PageNumberingOptions) => void;
}

export function PageNumberingModal({
  isOpen,
  onClose,
  options,
  onChange,
}: PageNumberingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="num-title"
      className="fixed inset-0 m-auto p-0 bg-transparent text-[#ebdbb2] border-0 backdrop:bg-[#1d2021]/80 backdrop:backdrop-blur-sm z-50 max-w-md w-full font-mono text-xs"
      onClose={onClose}
    >
      <div className="bg-[#282828] border border-[#504945] rounded shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c3836] bg-[#1d2021]">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#fabd2f]" />
            <span id="num-title" className="font-bold text-[#fbf1c7] text-xs">
              PAGE NUMBERING METADATA
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
          {/* Enable Toggle */}
          <label className="flex items-center justify-between p-2.5 rounded bg-[#1d2021] border border-[#3c3836] cursor-pointer">
            <div>
              <div className="font-bold text-xs text-[#fbf1c7]">STAMP PAGE NUMBERS</div>
              <div className="text-[#a89984] text-[10px]">
                Draw dynamic index coordinates onto exported pages
              </div>
            </div>
            <input
              type="checkbox"
              checked={options.enabled}
              onChange={(e) => onChange({ ...options, enabled: e.target.checked })}
              className="w-4 h-4 accent-[#fabd2f] cursor-pointer"
            />
          </label>

          {options.enabled && (
            <div className="flex flex-col gap-2.5">
              {/* Position */}
              <div className="flex flex-col gap-1">
                <span className="text-[#928374] text-[11px]">POSITION</span>
                <select
                  value={options.position}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      position: e.target.value as PageNumberingOptions['position'],
                    })
                  }
                  className="bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded px-2.5 py-1.5 text-xs text-[#fbf1c7] outline-none"
                >
                  <option value="bottom-center">Bottom Center (Footer)</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right (Header)</option>
                  <option value="top-center">Top Center</option>
                </select>
              </div>

              {/* Format */}
              <div className="flex flex-col gap-1">
                <span className="text-[#928374] text-[11px]">FORMAT TEMPLATE</span>
                <select
                  value={options.format}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      format: e.target.value as PageNumberingOptions['format'],
                    })
                  }
                  className="bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded px-2.5 py-1.5 text-xs text-[#fbf1c7] outline-none"
                >
                  <option value="Page {n} of {total}">Page 1 of 10</option>
                  <option value="Page {n}">Page 1</option>
                  <option value="{n}">1</option>
                </select>
              </div>

              {/* Font Size & Starting number */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[#928374] text-[11px]">FONT SIZE (PT)</span>
                  <input
                    type="number"
                    min={6}
                    max={24}
                    value={options.fontSize}
                    onChange={(e) =>
                      onChange({
                        ...options,
                        fontSize: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded px-2.5 py-1.5 text-xs text-[#fbf1c7] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#928374] text-[11px]">START INDEX</span>
                  <input
                    type="number"
                    min={1}
                    value={options.startNumber}
                    onChange={(e) =>
                      onChange({
                        ...options,
                        startNumber: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="bg-[#1d2021] border border-[#504945] focus:border-[#fabd2f] rounded px-2.5 py-1.5 text-xs text-[#fbf1c7] outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-[#3c3836] bg-[#1d2021]">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            CONFIRM
          </button>
        </div>
      </div>
    </dialog>
  );
}
