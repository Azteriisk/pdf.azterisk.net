'use client';

import React, { useRef, useState } from 'react';
import { WorkspacePage } from '@/lib/types';
import { PageCard } from './PageCard';
import { Plus, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageGridProps {
  pages: WorkspacePage[];
  selectedPageIds: Set<string>;
  onToggleSelect: (pageId: string, e: React.MouseEvent) => void;
  onRotate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onEdit: (page: WorkspacePage) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onFilesSelected: (files: File[]) => void;
  isLoadingFiles?: boolean;
}

export function PageGrid({
  pages,
  selectedPageIds,
  onToggleSelect,
  onRotate,
  onDelete,
  onDuplicate,
  onEdit,
  onReorder,
  onFilesSelected,
  isLoadingFiles = false,
}: PageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isAppendDragOver, setIsAppendDragOver] = useState(false);
  const appendInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorder(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAppendDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAppendDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleAppendInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 p-4 sm:p-6 max-w-7xl mx-auto">
      {pages.map((page, index) => (
        <PageCard
          key={page.id}
          page={page}
          index={index}
          total={pages.length}
          isSelected={selectedPageIds.has(page.id)}
          onToggleSelect={onToggleSelect}
          onRotate={onRotate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onMove={onReorder}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={draggedIndex === index}
          isDragOver={dragOverIndex === index && draggedIndex !== index}
        />
      ))}

      {/* Append Document Drop Target Card */}
      <div
        onClick={() => appendInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsAppendDragOver(true);
        }}
        onDragLeave={() => setIsAppendDragOver(false)}
        onDrop={handleAppendDrop}
        className={cn(
          'relative flex flex-col items-center justify-center min-h-[290px] rounded-lg border border-dashed cursor-pointer transition-all p-4',
          'bg-[#1d2021]/40 hover:bg-[#282828] text-center group',
          isAppendDragOver
            ? 'border-[#fabd2f] bg-[#32302f] ring-1 ring-[#fabd2f]'
            : 'border-[#3c3836] hover:border-[#665c54]'
        )}
        title="Drop more PDF files here or click to browse"
      >
        <input
          ref={appendInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleAppendInputChange}
          disabled={isLoadingFiles}
        />
        <div
          className={cn(
            'w-10 h-10 rounded-md border flex items-center justify-center transition-transform mb-2',
            'bg-[#282828] border-[#3c3836] text-[#fabd2f] group-hover:scale-105',
            isAppendDragOver && 'border-[#fabd2f] text-[#fabd2f]'
          )}
        >
          {isLoadingFiles ? (
            <div className="w-4 h-4 border-2 border-[#fabd2f] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </div>
        <div className="font-mono text-xs font-bold text-[#fbf1c7]">
          APPEND PDFS
        </div>
        <div className="font-mono text-[10px] text-[#7c6f64] mt-1 max-w-[140px]">
          Drop files directly here or click to browse
        </div>
      </div>
    </div>
  );
}
