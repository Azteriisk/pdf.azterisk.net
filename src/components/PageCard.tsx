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
  onToggleSelect: (pageId: string) => void;
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
  const hasEdits = page.annotations && page.annotations.length > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden transition-all duration-150',
        'bg-[#282828] border',
        isSelected
          ? 'border-[#fabd2f] shadow-lg shadow-[#fabd2f]/10 ring-1 ring-[#fabd2f]'
          : 'border-[#3c3836] hover:border-[#504945]',
        isDragging && 'opacity-40 scale-95 border-dashed border-[#fabd2f]',
        isDragOver && 'border-l-4 border-l-[#fabd2f]'
      )}
    >
      {/* Top Header inside Card */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1d2021]/60 border-b border-[#3c3836]">
        {/* Checkbox & Page Number */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSelect(page.id)}
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border',
              isSelected
                ? 'bg-[#fabd2f] border-[#fabd2f] text-[#1d2021]'
                : 'border-[#504945] bg-[#282828] text-transparent hover:border-[#7c6f64]'
            )}
            title={isSelected ? 'Deselect page' : 'Select page'}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
          <span className="text-xs font-bold text-[#fbf1c7] font-mono">
            #{index + 1}
          </span>
        </div>

        {/* Source file snippet & Edit badge */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          {hasEdits && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/40 font-medium">
              Edited
            </span>
          )}
          <span
            className="text-[11px] text-[#a89984] truncate max-w-[110px]"
            title={`${page.sourceDocName} (Page ${page.sourcePageIndex + 1})`}
          >
            {page.sourceDocName}
          </span>
        </div>

        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-[#7c6f64] hover:text-[#ebdbb2] p-0.5"
          title="Drag to rearrange"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Thumbnail Area */}
      <div
        className="relative flex items-center justify-center p-3 bg-[#1d2021]/30 min-h-[220px] max-h-[280px] overflow-hidden cursor-pointer"
        onClick={() => onEdit(page)}
        title="Click to edit or annotate this page"
      >
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${index + 1}`}
            className="max-h-[240px] max-w-full w-auto object-contain rounded shadow-md border border-[#3c3836] transition-transform duration-200 group-hover:scale-[1.02]"
            style={{
              transform: `rotate(${page.rotation}deg)`,
            }}
          />
        ) : (
          <div className="w-36 h-48 bg-[#32302f] border border-[#504945] rounded flex items-center justify-center text-[#7c6f64] text-xs">
            Loading preview...
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-[#1d2021]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <span className="px-3 py-1.5 rounded-lg bg-[#282828] text-xs font-medium text-[#fbf1c7] border border-[#504945] shadow-lg flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#fabd2f]" />
            Click to Edit
          </span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#282828] border-t border-[#3c3836] text-xs">
        {/* Reorder arrows */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="p-1 rounded text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#3c3836] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Move Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="p-1 rounded text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#3c3836] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Move Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rotate, Duplicate, Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRotate(page.id)}
            className="p-1.5 rounded text-[#83a598] hover:bg-[#3c3836] transition-colors cursor-pointer"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(page.id)}
            className="p-1.5 rounded text-[#b8bb26] hover:bg-[#3c3836] transition-colors cursor-pointer"
            title="Duplicate Page"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(page.id)}
            className="p-1.5 rounded text-[#fb4934] hover:bg-[#cc241d]/20 transition-colors cursor-pointer"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
