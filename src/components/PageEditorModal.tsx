'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
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
  Move,
  CheckSquare,
  Bold,
  Italic,
  Baseline,
  Loader2,
} from 'lucide-react';
import {
  WorkspacePage,
  PageAnnotation,
  DrawAnnotation,
  HighlightAnnotation,
  TextAnnotation,
  CheckmarkAnnotation,
  RedactAnnotation,
  ImageAnnotation,
  StampAnnotation,
  FormFieldItem,
} from '@/lib/types';
import { renderPageHighRes, getPageFormFields } from '@/lib/pdfjs-viewer';
import { SignatureModal } from './SignatureModal';
import { generateId, cn } from '@/lib/utils';

interface PageEditorModalProps {
  page: WorkspacePage | null;
  pdfArrayBuffer: ArrayBuffer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPage: WorkspacePage) => void;
}

type ToolMode = 'select' | 'text' | 'checkmark' | 'pen' | 'highlighter' | 'redact' | 'whiteout';

export function PageEditorModal({
  page,
  pdfArrayBuffer,
  isOpen,
  onClose,
  onSave,
}: PageEditorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Tool
  const [activeTool, setActiveTool] = useState<ToolMode>('text');

  // Text Tool Properties
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier'>('helvetica');
  const [textSize, setTextSize] = useState(14);
  const [textColor, setTextColor] = useState('#1d2021');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textBackground, setTextBackground] = useState(false);

  // Checkmark Tool Properties
  const [markType, setMarkType] = useState<'check' | 'cross' | 'dot'>('check');
  const [markSize, setMarkSize] = useState(16);
  const [markColor, setMarkColor] = useState('#1d2021');

  // Pen / Highlighter Properties
  const [penColor, setPenColor] = useState('#cc241d');
  const [penWidth, setPenWidth] = useState(3);
  const [highlightColor, setHighlightColor] = useState('#fabd2f');
  const [highlightWidth, setHighlightWidth] = useState(24);

  // Zoom
  const [zoomScale, setZoomScale] = useState(1);

  // Background Image & Form Fields
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormFieldItem[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});

  // Annotations Stack
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([]);
  const [undoStack, setUndoStack] = useState<PageAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<PageAnnotation[][]>([]);

  // Drawing state
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectPreview, setRectPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Selected annotation
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [draggingAnn, setDraggingAnn] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Signature modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Telemetry
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({ width: 600, height: 800 });
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Load preview & form fields
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && page) {
      if (!dialog.open) {
        dialog.showModal();
      }

      setAnnotations(page.annotations ? JSON.parse(JSON.stringify(page.annotations)) : []);
      setFormValues(page.formValues ? { ...page.formValues } : {});
      setUndoStack([]);
      setRedoStack([]);
      setSelectedAnnId(null);
      setPageDims({
        width: page.originalWidth || 595,
        height: page.originalHeight || 842,
      });

      if (page.thumbnailUrl) {
        setPageImageUrl(page.thumbnailUrl);
      }

      if (pdfArrayBuffer) {
        setIsLoadingPdf(true);
        // Render high-res
        renderPageHighRes(pdfArrayBuffer, page.sourcePageIndex, page.rotation, 1.8)
          .then(({ url, width, height }) => {
            setPageImageUrl(url);
            setPageDims({ width, height });
          })
          .catch((err) => console.error('Failed to render high-res page:', err))
          .finally(() => setIsLoadingPdf(false));

        // Detect interactive AcroForms on this page
        getPageFormFields(pdfArrayBuffer, page.sourcePageIndex, page.rotation)
          .then((fields) => {
            setFormFields(fields);
            // Prepopulate formValues if not already set
            setFormValues((prev) => {
              const updated = { ...prev };
              for (const f of fields) {
                if (updated[f.name] === undefined) {
                  updated[f.name] = f.value;
                }
              }
              return updated;
            });
          })
          .catch((err) => console.warn('Could not extract form fields:', err));
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setPageImageUrl(null);
      setFormFields([]);
    }
  }, [isOpen, page, pdfArrayBuffer]);

  // Sync toolbar with selected text annotation
  useEffect(() => {
    if (!selectedAnnId) return;
    const ann = annotations.find((a) => a.id === selectedAnnId);
    if (ann && ann.type === 'text') {
      const t = ann as TextAnnotation;
      setFontFamily(t.fontFamily || 'helvetica');
      setTextSize(t.size || 14);
      setTextColor(t.color || '#1d2021');
      setTextBold(Boolean(t.isBold));
      setTextItalic(Boolean(t.isItalic));
      setTextBackground(Boolean(t.hasBackground));
    }
  }, [selectedAnnId, annotations]);

  const updateSelectedTextAnnotation = (updates: Partial<TextAnnotation>) => {
    if (!selectedAnnId) return;
    setAnnotations((prev) =>
      prev.map((a) => (a.id === selectedAnnId && a.type === 'text' ? { ...a, ...updates } : a))
    );
  };

  const pushStateToUndo = useCallback((newAnns: PageAnnotation[]) => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newAnns);
  }, [annotations]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, annotations]);
    setUndoStack((u) => u.slice(0, -1));
    setAnnotations(prev);
    setSelectedAnnId(null);
  }, [undoStack, annotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, annotations]);
    setRedoStack((r) => r.slice(0, -1));
    setAnnotations(next);
    setSelectedAnnId(null);
  }, [redoStack, annotations]);

  const handleDeleteSelectedAnn = useCallback(() => {
    if (!selectedAnnId) return;
    pushStateToUndo(annotations.filter((a) => a.id !== selectedAnnId));
    setSelectedAnnId(null);
  }, [selectedAnnId, annotations, pushStateToUndo]);

  // Keyboard accelerators
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelectedAnn();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('checkmark');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('highlighter');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('redact');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo, handleDeleteSelectedAnn]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
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
      // Create new text box at click position with current font, size, and color
      const newText: TextAnnotation = {
        id: generateId(),
        type: 'text',
        text: 'Type text here...',
        x: coords.x,
        y: coords.y,
        size: textSize,
        color: textColor,
        fontFamily: fontFamily,
        isBold: textBold,
        isItalic: textItalic,
        hasBackground: textBackground,
      };
      pushStateToUndo([...annotations, newText]);
      setSelectedAnnId(newText.id);
      setActiveTool('select');
    } else if (activeTool === 'checkmark') {
      // Place a checkmark, cross, or dot at click position
      const newCheck: CheckmarkAnnotation = {
        id: generateId(),
        type: 'checkmark',
        markType: markType,
        x: coords.x,
        y: coords.y,
        size: markSize,
        color: markColor,
      };
      pushStateToUndo([...annotations, newCheck]);
      setSelectedAnnId(newCheck.id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);
    setCursorCoords({ x: Math.round(coords.x), y: Math.round(coords.y) });

    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter')) {
      setCurrentDrawPoints((prev) => [...prev, coords]);
    } else if (rectStart && (activeTool === 'redact' || activeTool === 'whiteout')) {
      const x = Math.min(rectStart.x, coords.x);
      const y = Math.min(rectStart.y, coords.y);
      const w = Math.abs(coords.x - rectStart.x);
      const h = Math.abs(coords.y - rectStart.y);
      setRectPreview({ x, y, w, h });
    } else if (draggingAnn) {
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

  const handleSave = () => {
    if (!page) return;
    onSave({
      ...page,
      annotations,
      formValues,
    });
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
        <div className="bg-[#282828] border border-[#504945] rounded-lg shadow-2xl h-full flex flex-col overflow-hidden font-mono text-xs">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c3836] bg-[#1d2021]">
            <div className="flex items-center gap-3">
              <span id="editor-title" className="font-bold text-[#fbf1c7] text-sm flex items-center gap-2">
                <span>PAGE {String(page.sourcePageIndex + 1).padStart(2, '0')}</span>
                <span className="text-[#928374] font-normal truncate max-w-[200px]">
                  ({page.sourceDocName})
                </span>
              </span>
              {formFields.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-[#83a598]/20 border border-[#83a598]/40 text-[10px] text-[#83a598]">
                  {formFields.length} INTERACTIVE FORM FIELDS
                </span>
              )}
            </div>

            {/* Undo / Redo & Zoom */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-1 rounded text-[#ebdbb2] hover:bg-[#32302f] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1 rounded text-[#ebdbb2] hover:bg-[#32302f] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <div className="h-3.5 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                className="p-1 rounded text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-[#a89984] w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                className="p-1 rounded text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-3.5 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#32302f] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tools Palette Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#282828] border-b border-[#3c3836]">
            {/* Tool selectors */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'select' as ToolMode, label: 'SELECT [V]', icon: Move },
                { id: 'text' as ToolMode, label: 'FILL / TEXT [T]', icon: Type },
                { id: 'checkmark' as ToolMode, label: 'CHECK (✓) [C]', icon: CheckSquare },
                { id: 'pen' as ToolMode, label: 'PEN [P]', icon: PenTool },
                { id: 'highlighter' as ToolMode, label: 'HIGHLIGHT [H]', icon: Highlighter },
                { id: 'redact' as ToolMode, label: 'REDACT [R]', icon: Square },
                { id: 'whiteout' as ToolMode, label: 'WHITEOUT', icon: Square },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTool(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px]',
                      activeTool === t.id
                        ? 'bg-[#fabd2f] text-[#1d2021] font-bold'
                        : 'text-[#ebdbb2] hover:bg-[#32302f] border border-transparent'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}

              <div className="h-3.5 w-px bg-[#3c3836] mx-1" />

              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-[#83a598] hover:bg-[#32302f] cursor-pointer border border-[#83a598]/30"
              >
                <FileSignature className="w-3.5 h-3.5" />
                SIGNATURE [S]
              </button>

              <div className="flex items-center gap-1">
                {['APPROVED', 'CONFIDENTIAL', 'DRAFT'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddStamp(s)}
                    className="px-2 py-0.5 rounded bg-[#1d2021] hover:bg-[#32302f] text-[10px] font-bold text-[#fb4934] border border-[#fb4934]/30 cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tool attributes (Live Font, Size, Color, Styling for Text) */}
            <div className="flex items-center gap-3">
              {(activeTool === 'text' || (selectedAnnId && annotations.find((a) => a.id === selectedAnnId)?.type === 'text')) && (
                <div className="flex items-center gap-2">
                  {/* Font Family */}
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      const fam = e.target.value as 'helvetica' | 'times' | 'courier';
                      setFontFamily(fam);
                      updateSelectedTextAnnotation({ fontFamily: fam });
                    }}
                    className="bg-[#1d2021] border border-[#504945] rounded px-2 py-0.5 text-[11px] text-[#fbf1c7] outline-none"
                    title="Font family (Standard PDF base fonts)"
                  >
                    <option value="helvetica">Helvetica (Sans)</option>
                    <option value="times">Times Roman (Serif)</option>
                    <option value="courier">Courier (Mono)</option>
                  </select>

                  {/* Font Size */}
                  <select
                    value={textSize}
                    onChange={(e) => {
                      const sz = parseInt(e.target.value, 10);
                      setTextSize(sz);
                      updateSelectedTextAnnotation({ size: sz });
                    }}
                    className="bg-[#1d2021] border border-[#504945] rounded px-1.5 py-0.5 text-[11px] text-[#fbf1c7] outline-none"
                    title="Font size (pt)"
                  >
                    {[10, 12, 14, 16, 18, 20, 24, 32].map((sz) => (
                      <option key={sz} value={sz}>{sz}pt</option>
                    ))}
                  </select>

                  {/* Bold & Italic Toggles */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !textBold;
                      setTextBold(next);
                      updateSelectedTextAnnotation({ isBold: next });
                    }}
                    className={cn(
                      'p-1 rounded cursor-pointer border',
                      textBold ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]' : 'bg-[#1d2021] text-[#ebdbb2] border-[#3c3836]'
                    )}
                    title="Bold"
                  >
                    <Bold className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !textItalic;
                      setTextItalic(next);
                      updateSelectedTextAnnotation({ isItalic: next });
                    }}
                    className={cn(
                      'p-1 rounded cursor-pointer border',
                      textItalic ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]' : 'bg-[#1d2021] text-[#ebdbb2] border-[#3c3836]'
                    )}
                    title="Italic"
                  >
                    <Italic className="w-3 h-3" />
                  </button>

                  {/* Opaque Whiteout Background for blank lines */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !textBackground;
                      setTextBackground(next);
                      updateSelectedTextAnnotation({ hasBackground: next });
                    }}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] cursor-pointer border',
                      textBackground ? 'bg-[#fbf1c7] text-[#1d2021] font-bold border-[#fbf1c7]' : 'bg-[#1d2021] text-[#a89984] border-[#3c3836]'
                    )}
                    title="Opaque white background to cleanly cover printed answer lines on worksheets"
                  >
                    MASK LINE
                  </button>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-1.5 ml-1">
                    {[
                      { hex: '#1d2021', title: 'Black' },
                      { hex: '#0f3460', title: 'Navy Blue' },
                      { hex: '#458588', title: 'Blue' },
                      { hex: '#cc241d', title: 'Crimson' },
                      { hex: '#98971a', title: 'Green' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setTextColor(c.hex);
                          updateSelectedTextAnnotation({ color: c.hex });
                        }}
                        className={cn(
                          'w-4 h-4 rounded-xs border transition-transform cursor-pointer',
                          textColor === c.hex ? 'scale-125 border-[#fabd2f]' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.title}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Checkmark sub-tools */}
              {activeTool === 'checkmark' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#928374]">MARK:</span>
                  {[
                    { id: 'check' as const, label: '✓ Check' },
                    { id: 'cross' as const, label: '✗ Cross' },
                    { id: 'dot' as const, label: '● Dot' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMarkType(m.id)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] cursor-pointer',
                        markType === m.id ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'bg-[#1d2021] text-[#ebdbb2]'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-1">
                    {['#1d2021', '#0f3460', '#cc241d', '#98971a'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setMarkColor(c)}
                        className={cn(
                          'w-4 h-4 rounded-xs border transition-transform cursor-pointer',
                          markColor === c ? 'scale-120 border-[#fabd2f]' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pen sub-tools */}
              {activeTool === 'pen' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#928374]">INK:</span>
                  {['#cc241d', '#458588', '#98971a', '#1d2021', '#ebdbb2'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPenColor(c)}
                      className={cn(
                        'w-4 h-4 rounded-xs border transition-transform cursor-pointer',
                        penColor === c ? 'scale-120 border-[#fabd2f]' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <span className="text-[#928374] ml-1">PX:</span>
                  {[2, 4, 8].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenWidth(w)}
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[10px] cursor-pointer',
                        penWidth === w ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'bg-[#1d2021] text-[#ebdbb2]'
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              {/* Highlighter sub-tools */}
              {activeTool === 'highlighter' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#928374]">COLOR:</span>
                  {['#fabd2f', '#b8bb26', '#8ec07c', '#83a598', '#fe8019'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHighlightColor(c)}
                      className={cn(
                        'w-4 h-4 rounded-xs border transition-transform cursor-pointer',
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
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#cc241d]/20 text-[#fb4934] border border-[#fb4934]/30 hover:bg-[#cc241d]/40 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETE ELEMENT
                </button>
              )}
            </div>
          </div>

          {/* Main Visual Canvas Area */}
          <div className="flex-1 overflow-auto bg-[#1d2021] flex items-center justify-center p-6 relative">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={cn(
                'relative shadow-2xl rounded-xs bg-white select-none touch-none',
                activeTool === 'pen' || activeTool === 'highlighter' ? 'cursor-crosshair' : '',
                activeTool === 'redact' || activeTool === 'whiteout' ? 'cursor-cell' : '',
                activeTool === 'text' || activeTool === 'checkmark' ? 'cursor-text' : '',
                activeTool === 'select' ? 'cursor-default' : ''
              )}
              style={{
                width: pageDims.width * zoomScale,
                height: pageDims.height * zoomScale,
              }}
            >
              {/* PDF Background Image */}
              {pageImageUrl ? (
                <img
                  src={pageImageUrl}
                  alt={`Page ${page.sourcePageIndex + 1}`}
                  draggable={false}
                  className="absolute inset-0 w-full h-full pointer-events-none select-none object-contain block"
                  style={{
                    width: pageDims.width * zoomScale,
                    height: pageDims.height * zoomScale,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#282828] text-[#7c6f64] text-xs font-mono">
                  LOADING PAGE DATA...
                </div>
              )}

              {/* Interactive AcroForm Fields Overlay (if present on PDF) */}
              {formFields.map((field) => {
                const [x1, y1, x2, y2] = field.rect;
                const fieldWidth = x2 - x1;
                const fieldHeight = y2 - y1;
                const canvasX = x1 * zoomScale;
                const canvasY = (pageDims.height - y2) * zoomScale;
                const canvasW = fieldWidth * zoomScale;
                const canvasH = fieldHeight * zoomScale;

                if (field.type === 'checkbox') {
                  const isChecked = Boolean(formValues[field.name]);
                  return (
                    <div
                      key={field.name}
                      style={{
                        position: 'absolute',
                        left: canvasX,
                        top: canvasY,
                        width: Math.max(canvasW, 16 * zoomScale),
                        height: Math.max(canvasH, 16 * zoomScale),
                      }}
                      className="flex items-center justify-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setFormValues((prev) => ({
                            ...prev,
                            [field.name]: e.target.checked,
                          }));
                        }}
                        className="w-full h-full accent-[#fabd2f] cursor-pointer"
                        title={`Form checkbox: ${field.name}`}
                      />
                    </div>
                  );
                }

                // Text Field
                const val = (formValues[field.name] as string) || '';
                return (
                  <div
                    key={field.name}
                    style={{
                      position: 'absolute',
                      left: canvasX,
                      top: canvasY,
                      width: canvasW,
                      height: canvasH,
                    }}
                  >
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setFormValues((prev) => ({
                          ...prev,
                          [field.name]: nextVal,
                        }));
                      }}
                      placeholder={`[${field.name}]`}
                      className="w-full h-full bg-[#fabd2f]/10 hover:bg-[#fabd2f]/20 focus:bg-white text-[#1d2021] border border-[#fabd2f]/50 focus:border-[#fabd2f] px-1 outline-none font-sans"
                      style={{
                        fontSize: Math.min(canvasH * 0.7, 14 * zoomScale),
                      }}
                    />
                  </div>
                );
              })}

              {/* SVG Layer for Freehand, Highlights, and Checkmarks */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${pageDims.width} ${pageDims.height}`}
              >
                {/* Freehand drawings */}
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

                {/* Live stroke in progress */}
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

                {/* Checkmarks & Crossmarks */}
                {annotations
                  .filter((a) => a.type === 'checkmark')
                  .map((ann) => {
                    const cAnn = ann as CheckmarkAnnotation;
                    const size = cAnn.size || 16;
                    const x = cAnn.x;
                    const y = cAnn.y;

                    if (cAnn.markType === 'cross') {
                      const half = size / 2;
                      return (
                        <g key={cAnn.id} stroke={cAnn.color} strokeWidth={2.5} strokeLinecap="round">
                          <line x1={x - half} y1={y - half} x2={x + half} y2={y + half} />
                          <line x1={x - half} y1={y + half} x2={x + half} y2={y - half} />
                        </g>
                      );
                    }
                    if (cAnn.markType === 'dot') {
                      return (
                        <circle
                          key={cAnn.id}
                          cx={x}
                          cy={y}
                          r={size / 3}
                          fill={cAnn.color}
                        />
                      );
                    }
                    // Standard Checkmark
                    return (
                      <polyline
                        key={cAnn.id}
                        points={`${x - size * 0.4},${y} ${x - size * 0.1},${y + size * 0.35} ${x + size * 0.45},${y - size * 0.4}`}
                        stroke={cAnn.color}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    );
                  })}
              </svg>

              {/* Redaction preview */}
              {rectPreview && (
                <div
                  className={cn(
                    'absolute border border-dashed pointer-events-none',
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

              {/* Committed Annotations (Text, Redaction, Stamps, Signatures) */}
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
                        selectedAnnId === rAnn.id ? 'ring-1 ring-[#fabd2f]' : ''
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
                  const fontCss =
                    tAnn.fontFamily === 'times'
                      ? 'ui-serif, Georgia, serif'
                      : tAnn.fontFamily === 'courier'
                      ? 'ui-monospace, Courier, monospace'
                      : 'ui-sans-serif, Arial, sans-serif';

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
                        'absolute p-0.5 rounded-xs transition-shadow',
                        selectedAnnId === tAnn.id
                          ? 'ring-1 ring-[#fabd2f] cursor-move'
                          : 'cursor-pointer',
                        tAnn.hasBackground ? 'bg-white shadow-xs' : ''
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
                        className="bg-transparent border-none outline-none"
                        style={{
                          fontFamily: fontCss,
                          fontSize: tAnn.size * zoomScale,
                          color: tAnn.color,
                          fontWeight: tAnn.isBold ? 'bold' : 'normal',
                          fontStyle: tAnn.isItalic ? 'italic' : 'normal',
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
                        'absolute border-2 rounded-xs flex items-center justify-center font-bold tracking-wider select-none',
                        selectedAnnId === sAnn.id
                          ? 'ring-1 ring-[#fabd2f] cursor-move'
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
                          ? 'ring-1 ring-[#fabd2f] cursor-move'
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
                        alt="Signature / Stamp"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* Bottom Telemetry & Commit Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#3c3836] bg-[#1d2021]">
            <div className="flex items-center gap-3 text-[11px] text-[#928374]">
              <span>
                X: <strong className="text-[#ebdbb2]">{cursorCoords.x}</strong> Y: <strong className="text-[#ebdbb2]">{cursorCoords.y}</strong> pt
              </span>
              <span className="text-[#3c3836]">•</span>
              <span>
                DIMENSIONS: {Math.round(pageDims.width)} × {Math.round(pageDims.height)} pt
              </span>
              <span className="text-[#3c3836]">•</span>
              <span>
                {annotations.length} LAYER{annotations.length === 1 ? '' : 'S'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded text-xs text-[#ebdbb2] hover:bg-[#282828] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-[#fabd2f] text-[#1d2021] hover:bg-[#fabd2f]/90 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                APPLY CHANGES
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
