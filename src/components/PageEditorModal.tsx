'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Check,
  RotateCw,
  Undo2,
  Redo2,
  Trash2,
  PenTool,
  Highlighter,
  Type,
  Square,
  FileSignature,
  ZoomIn,
  ZoomOut,
  Stamp,
  Maximize2,
  Move,
} from 'lucide-react';
import {
  WorkspacePage,
  PageAnnotation,
  DrawAnnotation,
  HighlightAnnotation,
  TextAnnotation,
  RedactAnnotation,
  ImageAnnotation,
  StampAnnotation,
} from '@/lib/types';
import { renderPageHighRes } from '@/lib/pdfjs-viewer';
import { SignatureModal } from './SignatureModal';
import { generateId, cn } from '@/lib/utils';

interface PageEditorModalProps {
  page: WorkspacePage | null;
  pdfArrayBuffer: ArrayBuffer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPage: WorkspacePage) => void;
}

type ToolMode = 'select' | 'pen' | 'highlighter' | 'text' | 'redact' | 'whiteout' | 'stamp';

export function PageEditorModal({
  page,
  pdfArrayBuffer,
  isOpen,
  onClose,
  onSave,
}: PageEditorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tools & State
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  const [penColor, setPenColor] = useState('#cc241d');
  const [penWidth, setPenWidth] = useState(3);
  const [highlightColor, setHighlightColor] = useState('#fabd2f');
  const [highlightWidth, setHighlightWidth] = useState(24);
  const [textSize, setTextSize] = useState(18);
  const [textColor, setTextColor] = useState('#1d2021');
  const [textBold, setTextBold] = useState(true);

  // Zoom
  const [zoomScale, setZoomScale] = useState(1);

  // Annotations
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([]);
  const [undoStack, setUndoStack] = useState<PageAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<PageAnnotation[][]>([]);

  // Drawing in progress
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectPreview, setRectPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Selected annotation for dragging/editing
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [draggingAnn, setDraggingAnn] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Signature modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Page dimensions
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({ width: 600, height: 800 });
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Initialize dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      if (page) {
        setAnnotations(page.annotations ? JSON.parse(JSON.stringify(page.annotations)) : []);
        setUndoStack([]);
        setRedoStack([]);
        setSelectedAnnId(null);
        loadPagePreview();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, page]);

  const loadPagePreview = async () => {
    if (!page || !pdfArrayBuffer) return;
    setIsLoadingPdf(true);
    try {
      const { canvas, width, height } = await renderPageHighRes(
        pdfArrayBuffer,
        page.sourcePageIndex,
        page.rotation,
        1.5
      );

      setPageDims({ width, height });

      const bgCanvas = bgCanvasRef.current;
      if (bgCanvas) {
        bgCanvas.width = width;
        bgCanvas.height = height;
        const ctx = bgCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Failed to load high res page preview:', err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const pushStateToUndo = (newAnns: PageAnnotation[]) => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newAnns);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, annotations]);
    setUndoStack((u) => u.slice(0, -1));
    setAnnotations(prev);
    setSelectedAnnId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, annotations]);
    setRedoStack((r) => r.slice(0, -1));
    setAnnotations(next);
    setSelectedAnnId(null);
  };

  // Convert client coordinate into canvas page coordinate
  const getCanvasCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;
    return {
      x: Math.max(0, Math.min(x, pageDims.width)),
      y: Math.max(0, Math.min(y, pageDims.height)),
    };
  };

  // Pointer interactions on overlay
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click
    const coords = getCanvasCoords(e);

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentDrawPoints([coords]);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } else if (activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentDrawPoints([coords]);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } else if (activeTool === 'redact' || activeTool === 'whiteout') {
      setRectStart(coords);
      setRectPreview({ x: coords.x, y: coords.y, w: 0, h: 0 });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } else if (activeTool === 'text') {
      // Add a text box at click
      const newText: TextAnnotation = {
        id: generateId(),
        type: 'text',
        text: 'Type text here...',
        x: coords.x,
        y: coords.y,
        size: textSize,
        color: textColor,
        isBold: textBold,
      };
      pushStateToUndo([...annotations, newText]);
      setSelectedAnnId(newText.id);
      setActiveTool('select');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);

    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter')) {
      setCurrentDrawPoints((prev) => [...prev, coords]);
    } else if (rectStart && (activeTool === 'redact' || activeTool === 'whiteout')) {
      const x = Math.min(rectStart.x, coords.x);
      const y = Math.min(rectStart.y, coords.y);
      const w = Math.abs(coords.x - rectStart.x);
      const h = Math.abs(coords.y - rectStart.y);
      setRectPreview({ x, y, w, h });
    } else if (draggingAnn) {
      // Move selected annotation
      const updated = annotations.map((ann) => {
        if (ann.id !== draggingAnn.id) return ann;
        if ('x' in ann && 'y' in ann) {
          return {
            ...ann,
            x: Math.round(coords.x - draggingAnn.offsetX),
            y: Math.round(coords.y - draggingAnn.offsetY),
          };
        }
        return ann;
      });
      setAnnotations(updated);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter')) {
      setIsDrawing(false);
      if (currentDrawPoints.length > 1) {
        if (activeTool === 'pen') {
          const newDraw: DrawAnnotation = {
            id: generateId(),
            type: 'draw',
            points: currentDrawPoints,
            strokeWidth: penWidth,
            color: penColor,
            opacity: 1,
          };
          pushStateToUndo([...annotations, newDraw]);
        } else {
          // Highlighter stroke
          const newDraw: DrawAnnotation = {
            id: generateId(),
            type: 'draw',
            points: currentDrawPoints,
            strokeWidth: highlightWidth,
            color: highlightColor,
            opacity: 0.35,
          };
          pushStateToUndo([...annotations, newDraw]);
        }
      }
      setCurrentDrawPoints([]);
    } else if (rectStart && rectPreview && (activeTool === 'redact' || activeTool === 'whiteout')) {
      if (rectPreview.w > 5 && rectPreview.h > 5) {
        const newRect: RedactAnnotation = {
          id: generateId(),
          type: 'redact',
          x: rectPreview.x,
          y: rectPreview.y,
          width: rectPreview.w,
          height: rectPreview.h,
          color: activeTool === 'whiteout' ? '#ffffff' : '#000000',
        };
        pushStateToUndo([...annotations, newRect]);
      }
      setRectStart(null);
      setRectPreview(null);
    } else if (draggingAnn) {
      setUndoStack((prev) => [...prev, annotations]);
      setDraggingAnn(null);
    }
  };

  // Add a Stamp
  const handleAddStamp = (stampText: string) => {
    const newStamp: StampAnnotation = {
      id: generateId(),
      type: 'stamp',
      text: stampText,
      x: pageDims.width / 2 - 100,
      y: pageDims.height / 2 - 35,
      width: 200,
      height: 70,
      color: '#cc241d',
    };
    pushStateToUndo([...annotations, newStamp]);
    setSelectedAnnId(newStamp.id);
    setActiveTool('select');
  };

  // Add digital signature
  const handleAddSignature = (dataUrl: string) => {
    const newSig: ImageAnnotation = {
      id: generateId(),
      type: 'image',
      dataUrl,
      x: pageDims.width / 2 - 110,
      y: pageDims.height - 150,
      width: 220,
      height: 90,
      label: 'Signature',
    };
    pushStateToUndo([...annotations, newSig]);
    setSelectedAnnId(newSig.id);
    setActiveTool('select');
  };

  // Delete selected annotation
  const handleDeleteSelectedAnn = () => {
    if (!selectedAnnId) return;
    pushStateToUndo(annotations.filter((a) => a.id !== selectedAnnId));
    setSelectedAnnId(null);
  };

  // Save changes back to page
  const handleSave = () => {
    if (!page) return;
    const updatedPage: WorkspacePage = {
      ...page,
      annotations,
    };
    onSave(updatedPage);
    onClose();
  };

  if (!isOpen || !page) return null;

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby="editor-title"
        className="fixed inset-0 m-auto p-0 bg-transparent text-[#ebdbb2] border-0 backdrop:bg-[#1d2021]/85 backdrop:backdrop-blur-md z-40 w-[96vw] max-w-6xl h-[94vh] max-h-[900px]"
        onClose={onClose}
      >
        <div className="bg-[#282828] border border-[#504945] rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#3c3836] bg-[#1d2021]/80">
            <div className="flex items-center gap-3">
              <h2 id="editor-title" className="font-bold text-[#fbf1c7] text-base flex items-center gap-2">
                <span>Edit Page #{page.sourcePageIndex + 1}</span>
                <span className="text-xs text-[#a89984] font-normal truncate max-w-[200px]">
                  ({page.sourceDocName})
                </span>
              </h2>
            </div>

            {/* Undo/Redo & Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded text-[#ebdbb2] hover:bg-[#32302f] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded text-[#ebdbb2] hover:bg-[#32302f] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
                className="p-1.5 rounded text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-[#a89984] w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.15))}
                className="p-1.5 rounded text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tools Palette Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#1d2021]/50 border-b border-[#3c3836] text-xs">
            {/* Tool selectors */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'select'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <Move className="w-3.5 h-3.5" />
                Select / Move
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'pen'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <PenTool className="w-3.5 h-3.5" />
                Pen
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('highlighter')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'highlighter'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <Highlighter className="w-3.5 h-3.5" />
                Highlighter
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'text'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <Type className="w-3.5 h-3.5" />
                Add Text
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('redact')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'redact'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Redact (Black)
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('whiteout')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeTool === 'whiteout'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-semibold'
                    : 'text-[#ebdbb2] hover:bg-[#32302f]'
                )}
              >
                <Square className="w-3.5 h-3.5 text-white" />
                Whiteout
              </button>

              <div className="h-4 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[#83a598] hover:bg-[#32302f] cursor-pointer border border-[#83a598]/30"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Sign
              </button>

              {/* Stamp presets dropdown/buttons */}
              <div className="flex items-center gap-1">
                {['APPROVED', 'CONFIDENTIAL', 'DRAFT'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddStamp(s)}
                    className="px-2 py-1 rounded bg-[#32302f] hover:bg-[#3c3836] text-[10px] font-bold text-[#fb4934] border border-[#fb4934]/30 cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tool options (colors, width, font) */}
            <div className="flex items-center gap-3">
              {activeTool === 'pen' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#a89984]">Color:</span>
                  {['#cc241d', '#458588', '#98971a', '#1d2021', '#ebdbb2'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPenColor(c)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-transform cursor-pointer',
                        penColor === c ? 'scale-120 border-[#fabd2f]' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <span className="text-[#a89984] ml-2">Size:</span>
                  {[2, 4, 8].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenWidth(w)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer',
                        penWidth === w ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#32302f] text-[#ebdbb2]'
                      )}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              )}

              {activeTool === 'highlighter' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#a89984]">Color:</span>
                  {['#fabd2f', '#b8bb26', '#8ec07c', '#83a598', '#fe8019'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHighlightColor(c)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-transform cursor-pointer',
                        highlightColor === c ? 'scale-120 border-white' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}

              {selectedAnnId && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedAnn}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#cc241d]/20 text-[#fb4934] border border-[#fb4934]/30 hover:bg-[#cc241d]/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              )}
            </div>
          </div>

          {/* Main Visual Canvas Area */}
          <div className="flex-1 overflow-auto bg-[#1d2021] flex items-center justify-center p-6 relative">
            {isLoadingPdf ? (
              <div className="flex flex-col items-center gap-3 text-[#fabd2f]">
                <div className="w-8 h-8 border-3 border-[#fabd2f] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#ebdbb2]">Rendering high resolution page...</span>
              </div>
            ) : (
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={cn(
                  'relative shadow-2xl rounded-sm bg-white select-none touch-none',
                  activeTool === 'pen' || activeTool === 'highlighter' ? 'cursor-crosshair' : '',
                  activeTool === 'redact' || activeTool === 'whiteout' ? 'cursor-cell' : '',
                  activeTool === 'text' ? 'cursor-text' : '',
                  activeTool === 'select' ? 'cursor-default' : ''
                )}
                style={{
                  width: pageDims.width * zoomScale,
                  height: pageDims.height * zoomScale,
                }}
              >
                {/* PDF Page Rendered on Background Canvas */}
                <canvas
                  ref={bgCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none block"
                  style={{
                    width: pageDims.width * zoomScale,
                    height: pageDims.height * zoomScale,
                  }}
                />

                {/* SVG Layer for Freehand Drawings & Highlighting */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${pageDims.width} ${pageDims.height}`}
                >
                  {annotations
                    .filter((a) => a.type === 'draw')
                    .map((ann) => {
                      const dAnn = ann as DrawAnnotation;
                      if (!dAnn.points || dAnn.points.length < 2) return null;
                      const pathStr = dAnn.points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                        .join(' ');
                      return (
                        <path
                          key={dAnn.id}
                          d={pathStr}
                          stroke={dAnn.color}
                          strokeWidth={dAnn.strokeWidth}
                          strokeOpacity={dAnn.opacity ?? 1}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      );
                    })}

                  {/* Current Active Freehand Stroke */}
                  {isDrawing && currentDrawPoints.length > 1 && (
                    <path
                      d={currentDrawPoints
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                        .join(' ')}
                      stroke={activeTool === 'pen' ? penColor : highlightColor}
                      strokeWidth={activeTool === 'pen' ? penWidth : highlightWidth}
                      strokeOpacity={activeTool === 'pen' ? 1 : 0.35}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </svg>

                {/* Redaction / Whiteout Preview */}
                {rectPreview && (
                  <div
                    className={cn(
                      'absolute border-2 border-dashed pointer-events-none',
                      activeTool === 'whiteout'
                        ? 'bg-white border-[#fabd2f]'
                        : 'bg-black border-[#fb4934]'
                    )}
                    style={{
                      left: rectPreview.x * zoomScale,
                      top: rectPreview.y * zoomScale,
                      width: rectPreview.w * zoomScale,
                      height: rectPreview.h * zoomScale,
                    }}
                  />
                )}

                {/* Committed Overlay Annotations (Text, Redaction, Stamps, Signatures) */}
                {annotations.map((ann) => {
                  if (ann.type === 'redact') {
                    const rAnn = ann as RedactAnnotation;
                    return (
                      <div
                        key={rAnn.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnnId(rAnn.id);
                        }}
                        className={cn(
                          'absolute cursor-pointer transition-shadow',
                          selectedAnnId === rAnn.id ? 'ring-2 ring-[#fabd2f]' : ''
                        )}
                        style={{
                          left: rAnn.x * zoomScale,
                          top: rAnn.y * zoomScale,
                          width: rAnn.width * zoomScale,
                          height: rAnn.height * zoomScale,
                          backgroundColor: rAnn.color,
                        }}
                      />
                    );
                  }

                  if (ann.type === 'text') {
                    const tAnn = ann as TextAnnotation;
                    return (
                      <div
                        key={tAnn.id}
                        onPointerDown={(e) => {
                          if (activeTool === 'select') {
                            e.stopPropagation();
                            setSelectedAnnId(tAnn.id);
                            const coords = getCanvasCoords(e);
                            setDraggingAnn({
                              id: tAnn.id,
                              offsetX: coords.x - tAnn.x,
                              offsetY: coords.y - tAnn.y,
                            });
                          }
                        }}
                        className={cn(
                          'absolute p-1 rounded transition-shadow',
                          selectedAnnId === tAnn.id
                            ? 'ring-2 ring-[#fabd2f] bg-[#fabd2f]/10 cursor-move'
                            : 'cursor-pointer'
                        )}
                        style={{
                          left: tAnn.x * zoomScale,
                          top: tAnn.y * zoomScale,
                        }}
                      >
                        <input
                          type="text"
                          value={tAnn.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === tAnn.id ? { ...a, text: val } : a))
                            );
                          }}
                          className="bg-transparent border-none outline-none font-sans"
                          style={{
                            fontSize: tAnn.size * zoomScale,
                            color: tAnn.color,
                            fontWeight: tAnn.isBold ? 'bold' : 'normal',
                          }}
                        />
                      </div>
                    );
                  }

                  if (ann.type === 'stamp') {
                    const sAnn = ann as StampAnnotation;
                    return (
                      <div
                        key={sAnn.id}
                        onPointerDown={(e) => {
                          if (activeTool === 'select') {
                            e.stopPropagation();
                            setSelectedAnnId(sAnn.id);
                            const coords = getCanvasCoords(e);
                            setDraggingAnn({
                              id: sAnn.id,
                              offsetX: coords.x - sAnn.x,
                              offsetY: coords.y - sAnn.y,
                            });
                          }
                        }}
                        className={cn(
                          'absolute border-2 rounded flex items-center justify-center font-bold tracking-wider select-none',
                          selectedAnnId === sAnn.id
                            ? 'ring-2 ring-[#fabd2f] cursor-move'
                            : 'cursor-pointer'
                        )}
                        style={{
                          left: sAnn.x * zoomScale,
                          top: sAnn.y * zoomScale,
                          width: sAnn.width * zoomScale,
                          height: sAnn.height * zoomScale,
                          borderColor: sAnn.color,
                          color: sAnn.color,
                          backgroundColor: `${sAnn.color}15`,
                          fontSize: (sAnn.height * 0.45) * zoomScale,
                        }}
                      >
                        {sAnn.text}
                      </div>
                    );
                  }

                  if (ann.type === 'image') {
                    const iAnn = ann as ImageAnnotation;
                    return (
                      <div
                        key={iAnn.id}
                        onPointerDown={(e) => {
                          if (activeTool === 'select') {
                            e.stopPropagation();
                            setSelectedAnnId(iAnn.id);
                            const coords = getCanvasCoords(e);
                            setDraggingAnn({
                              id: iAnn.id,
                              offsetX: coords.x - iAnn.x,
                              offsetY: coords.y - iAnn.y,
                            });
                          }
                        }}
                        className={cn(
                          'absolute select-none',
                          selectedAnnId === iAnn.id
                            ? 'ring-2 ring-[#fabd2f] cursor-move'
                            : 'cursor-pointer'
                        )}
                        style={{
                          left: iAnn.x * zoomScale,
                          top: iAnn.y * zoomScale,
                          width: iAnn.width * zoomScale,
                          height: iAnn.height * zoomScale,
                        }}
                      >
                        <img
                          src={iAnn.dataUrl}
                          alt="Signature / Image"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>

          {/* Bottom Dialog Action Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#3c3836] bg-[#1d2021]/80">
            <div className="text-xs text-[#a89984]">
              {annotations.length} {annotations.length === 1 ? 'annotation' : 'annotations'} on this page
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer shadow-md transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Apply to Page
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleAddSignature}
      />
    </>
  );
}
