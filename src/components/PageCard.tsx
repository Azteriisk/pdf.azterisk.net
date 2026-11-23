'use client';

import React from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  Edit3,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { WorkspacePage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PageCardProps {
  page: WorkspacePage;
  index: number;
  total: number;
  isSelected: boolean;
  onToggleSelect: (pageId: string, e: React.MouseEvent) => void;
  onRotate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onEdit: (page: WorkspacePage) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function PageCard({
  page,
  index,
  total,
  isSelected,
  onToggleSelect,
  onRotate,
  onDelete,
  onDuplicate,
  onEdit,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
}: PageCardProps) {
  const annotationCount = page.annotations ? page.annotations.length : 0;
  const filledFieldCount = page.formValues
    ? Object.values(page.formValues).filter((v) => v !== '' && v !== false && v !== undefined).length
    : 0;
  const isLandscape = (page.rotation % 180 === 90)
    ? page.originalWidth < page.originalHeight
    : page.originalWidth > page.originalHeight;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex flex-col rounded-lg overflow-hidden transition-all duration-150',
        'bg-[#282828] border',
        isSelected
          ? 'border-[#fabd2f] ring-1 ring-[#fabd2f] bg-[#32302f]'
          : 'border-[#3c3836] hover:border-[#504945]',
        isDragging && 'opacity-30 scale-95 border-dashed border-[#fabd2f]',
        isDragOver && 'border-l-4 border-l-[#fabd2f]'
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#1d2021] border-b border-[#3c3836]">
        {/* Checkbox & Page Number */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(page.id, e);
            }}
            className={cn(
              'w-4 h-4 rounded-xs flex items-center justify-center transition-colors cursor-pointer border',
              isSelected
                ? 'bg-[#fabd2f] border-[#fabd2f] text-[#1d2021]'
                : 'border-[#504945] bg-[#282828] text-transparent hover:border-[#665c54]'
            )}
            title="Toggle selection (Shift-click to select range)"
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>
          <span className="text-[11px] font-mono font-bold text-[#fbf1c7]">
            {String(index + 1).padStart(2, '0')}
            <span className="text-[#665c54] font-normal">/{String(total).padStart(2, '0')}</span>
          </span>
        </div>

        {/* Source file tag & annotation count */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          {annotationCount > 0 && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/30">
              {annotationCount} EDIT{annotationCount > 1 ? 'S' : ''}
            </span>
          )}
          {filledFieldCount > 0 && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#83a598]/20 text-[#83a598] border border-[#83a598]/30">
              {filledFieldCount} FIELD{filledFieldCount > 1 ? 'S' : ''}
            </span>
          )}
          <span
            className="text-[10px] font-mono text-[#928374] truncate max-w-[100px]"
            title={`${page.sourceDocName} (Page ${page.sourcePageIndex + 1})`}
          >
            {page.sourceDocName}
          </span>
        </div>

        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-[#665c54] hover:text-[#ebdbb2] p-0.5"
          title="Drag to reposition page"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Thumbnail Area */}
      <div
        className="relative flex items-center justify-center p-3 bg-[#1d2021]/40 min-h-[220px] max-h-[260px] overflow-hidden cursor-pointer"
        onClick={() => onEdit(page)}
        title="Open visual editor for this page"
      >
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${index + 1}`}
            className="max-h-[220px] max-w-full w-auto object-contain rounded-xs shadow-md border border-[#3c3836] transition-transform duration-150 group-hover:scale-[1.01]"
            style={{
              transform: `rotate(${page.rotation}deg)`,
            }}
          />
        ) : (
          <div className="w-36 h-48 bg-[#282828] border border-[#3c3836] rounded-xs flex items-center justify-center text-[#7c6f64] text-[11px] font-mono">
            RENDERING...
          </div>
        )}

        {/* Technical telemetry overlay on hover */}
        <div className="absolute inset-0 bg-[#1d2021]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none p-3">
          <span className="px-2.5 py-1 rounded bg-[#282828] text-xs font-mono text-[#fbf1c7] border border-[#504945] flex items-center gap-1.5 shadow">
            <Edit3 className="w-3 h-3 text-[#fabd2f]" />
            EDIT CANVAS
          </span>
          <div className="text-[10px] font-mono text-[#a89984]">
            {Math.round(page.originalWidth)} × {Math.round(page.originalHeight)} pt • {isLandscape ? 'Landscape' : 'Portrait'}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#282828] border-t border-[#3c3836] text-xs font-mono">
        {/* Step reordering */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="p-1 rounded text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#32302f] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            title="Move Page Backward"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="p-1 rounded text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#32302f] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            title="Move Page Forward"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRotate(page.id)}
            className="p-1 rounded text-[#83a598] hover:bg-[#32302f] hover:text-[#83a598] transition-colors cursor-pointer"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(page.id)}
            className="p-1 rounded text-[#b8bb26] hover:bg-[#32302f] transition-colors cursor-pointer"
            title="Duplicate Page"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(page.id)}
            className="p-1 rounded text-[#fb4934] hover:bg-[#cc241d]/20 transition-colors cursor-pointer"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
