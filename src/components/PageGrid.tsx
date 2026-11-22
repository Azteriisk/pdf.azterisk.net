'use client';

import React, { useState } from 'react';
import { WorkspacePage } from '@/lib/types';
import { PageCard } from './PageCard';

interface PageGridProps {
  pages: WorkspacePage[];
  selectedPageIds: Set<string>;
  onToggleSelect: (pageId: string) => void;
  onRotate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onEdit: (page: WorkspacePage) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
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
}: PageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag preview
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
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
    </div>
  );
}
