'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#1d2021');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        clearCanvas();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sig-title"
      className="fixed inset-0 m-auto p-0 bg-transparent text-[#ebdbb2] border-0 backdrop:bg-[#1d2021]/80 backdrop:backdrop-blur-sm z-50 max-w-lg w-full"
      onClose={onClose}
    >
      <div className="bg-[#282828] border border-[#504945] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3c3836]">
          <h3 id="sig-title" className="font-bold text-[#fbf1c7] text-base">
            Draw Your Signature
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center">
          {/* Canvas */}
          <div className="w-full bg-[#fbf1c7] rounded-xl border-2 border-dashed border-[#7c6f64] overflow-hidden shadow-inner touch-none relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="w-full h-48 cursor-crosshair block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#7c6f64] text-xs font-medium">
                Sign with your mouse, pen, or finger here
              </div>
            )}
          </div>

          {/* Color choices & clear */}
          <div className="flex items-center justify-between w-full mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a89984]">Ink:</span>
              {[
                { label: 'Black', color: '#1d2021' },
                { label: 'Navy Blue', color: '#0f3460' },
                { label: 'Red', color: '#cc241d' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setStrokeColor(c.color)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
                    strokeColor === c.color ? 'scale-115 border-[#fabd2f]' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#ebdbb2] bg-[#32302f] hover:bg-[#3c3836] border border-[#504945] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#fb4934]" />
              Clear
            </button>
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
            disabled={!hasDrawn}
            onClick={handleSave}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer transition-all',
              !hasDrawn && 'opacity-40 cursor-not-allowed'
            )}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Insert Signature
          </button>
        </div>
      </div>
    </dialog>
  );
}
