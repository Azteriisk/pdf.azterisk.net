'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Dropzone } from '@/components/Dropzone';
import { WorkspaceToolbar } from '@/components/WorkspaceToolbar';
import { PageGrid } from '@/components/PageGrid';
import { PageEditorModal } from '@/components/PageEditorModal';
import { SplitModal } from '@/components/SplitModal';
import { PageNumberingModal } from '@/components/PageNumberingModal';
import {
  SourceDocument,
  WorkspacePage,
  PageNumberingOptions,
  SplitOptions,
} from '@/lib/types';
import { getDocumentInfo, renderThumbnail } from '@/lib/pdfjs-viewer';
import {
  buildPdf,
  splitIntoZip,
  splitByRangesToZip,
} from '@/lib/pdf-service';
import {
  generateId,
  downloadBytes,
  downloadBlob,
} from '@/lib/utils';
import JSZip from 'jszip';
import { Check, Info } from 'lucide-react';

export default function Home() {
  const [sourceDocs, setSourceDocs] = useState<Map<string, SourceDocument>>(new Map());
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [lastSelectedPageId, setLastSelectedPageId] = useState<string | null>(null);
  const [docName, setDocName] = useState('merged_document.pdf');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [editingPage, setEditingPage] = useState<WorkspacePage | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isPageNumbersModalOpen, setIsPageNumbersModalOpen] = useState(false);

  // Status Notification
  const [statusLog, setStatusLog] = useState<string | null>(null);

  // Page numbering options
  const [pageNumbering, setPageNumbering] = useState<PageNumberingOptions>({
    enabled: false,
    position: 'bottom-center',
    format: 'Page {n} of {total}',
    fontSize: 10,
    color: '#504945',
    startNumber: 1,
  });

  const showStatus = useCallback((msg: string) => {
    setStatusLog(msg);
    setTimeout(() => {
      setStatusLog((cur) => (cur === msg ? null : cur));
    }, 4000);
  }, []);

  // Process incoming PDF files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoadingFiles(true);

    try {
      const newSourceDocs = new Map(sourceDocs);
      const newPages: WorkspacePage[] = [];

      for (const file of files) {
        const fileId = generateId();
        const arrayBuffer = await file.arrayBuffer();

        const { numPages, dimensions } = await getDocumentInfo(arrayBuffer);

        const sourceDoc: SourceDocument = {
          id: fileId,
          name: file.name,
          size: file.size,
          arrayBuffer,
          pageCount: numPages,
        };
        newSourceDocs.set(fileId, sourceDoc);

        for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
          const pageId = `${fileId}_p${pageIdx + 1}_${generateId()}`;
          const dim = dimensions[pageIdx] || { width: 595, height: 842 };

          let thumbUrl = '';
          try {
            const { url } = await renderThumbnail(arrayBuffer, pageIdx, 0, 300);
            thumbUrl = url;
          } catch (e) {
            console.warn(`Could not render thumbnail for page ${pageIdx + 1}:`, e);
          }

          newPages.push({
            id: pageId,
            sourceDocId: fileId,
            sourceDocName: file.name,
            sourcePageIndex: pageIdx,
            rotation: 0,
            thumbnailUrl: thumbUrl,
            originalWidth: dim.width,
            originalHeight: dim.height,
            annotations: [],
          });
        }
      }

      setSourceDocs(newSourceDocs);
      setPages((prev) => [...prev, ...newPages]);

      if (pages.length === 0 && files.length > 0) {
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setDocName(files.length === 1 ? `${base}_edited.pdf` : `${base}_merged.pdf`);
      }

      showStatus(`INGESTED ${files.length} FILE${files.length > 1 ? 'S' : ''} (+${newPages.length} PAGES)`);
    } catch (err: any) {
      console.error('Error loading PDF files:', err);
      showStatus('ERROR: FAILED TO PARSE PDF BYTES');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Toggle selection with Shift-click range support
  const handleToggleSelect = (pageId: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedPageId && lastSelectedPageId !== pageId) {
      const lastIdx = pages.findIndex((p) => p.id === lastSelectedPageId);
      const curIdx = pages.findIndex((p) => p.id === pageId);
      if (lastIdx !== -1 && curIdx !== -1) {
        const start = Math.min(lastIdx, curIdx);
        const end = Math.max(lastIdx, curIdx);
        setSelectedPageIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            next.add(pages[i].id);
          }
          return next;
        });
        setLastSelectedPageId(pageId);
        return;
      }
    }

    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
    setLastSelectedPageId(pageId);
  };

  const handleSelectAll = useCallback(() => {
    setSelectedPageIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPageIds(new Set());
    setLastSelectedPageId(null);
  }, []);

  const handleSelectOdd = () => {
    const oddIds = pages.filter((_, idx) => idx % 2 === 0).map((p) => p.id);
    setSelectedPageIds(new Set(oddIds));
  };

  const handleSelectEven = () => {
    const evenIds = pages.filter((_, idx) => idx % 2 === 1).map((p) => p.id);
    setSelectedPageIds(new Set(evenIds));
  };

  // Rotate single page
  const handleRotatePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          rotation: (p.rotation + 90) % 360,
        };
      })
    );
  };

  // Rotate selected pages or all
  const handleRotateSelected = useCallback((direction: 'cw' | 'ccw' = 'cw') => {
    const delta = direction === 'cw' ? 90 : 270;
    const targetIds = selectedPageIds.size > 0 ? selectedPageIds : new Set(pages.map((p) => p.id));
    setPages((prev) =>
      prev.map((p) => {
        if (!targetIds.has(p.id)) return p;
        return {
          ...p,
          rotation: (p.rotation + delta) % 360,
        };
      })
    );
    showStatus(`ROTATED ${targetIds.size} PAGE${targetIds.size > 1 ? 'S' : ''} ${direction.toUpperCase()}`);
  }, [selectedPageIds, pages, showStatus]);

  // Delete single page
  const handleDeletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  };

  // Delete selected pages
  const handleDeleteSelected = useCallback(() => {
    if (selectedPageIds.size === 0) return;
    const count = selectedPageIds.size;
    setPages((prev) => prev.filter((p) => !selectedPageIds.has(p.id)));
    setSelectedPageIds(new Set());
    setLastSelectedPageId(null);
    showStatus(`REMOVED ${count} PAGE${count > 1 ? 'S' : ''}`);
  }, [selectedPageIds, showStatus]);

  // Duplicate single page
  const handleDuplicatePage = (pageId: string) => {
    setPages((prev) => {
      const index = prev.findIndex((p) => p.id === pageId);
      if (index === -1) return prev;
      const original = prev[index];
      const clone: WorkspacePage = {
        ...original,
        id: generateId(),
        annotations: JSON.parse(JSON.stringify(original.annotations || [])),
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
    showStatus('DUPLICATED 1 PAGE');
  };

  // Duplicate selected pages
  const handleDuplicateSelected = useCallback(() => {
    if (selectedPageIds.size === 0) return;
    setPages((prev) => {
      const next: WorkspacePage[] = [];
      for (const p of prev) {
        next.push(p);
        if (selectedPageIds.has(p.id)) {
          next.push({
            ...p,
            id: generateId(),
            annotations: JSON.parse(JSON.stringify(p.annotations || [])),
          });
        }
      }
      return next;
    });
    showStatus(`DUPLICATED ${selectedPageIds.size} PAGE${selectedPageIds.size > 1 ? 'S' : ''}`);
  }, [selectedPageIds, showStatus]);

  // Reorder pages
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // Save changes from PageEditorModal
  const handleSaveEditedPage = async (updatedPage: WorkspacePage) => {
    setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
    setEditingPage(null);

    const srcDoc = sourceDocs.get(updatedPage.sourceDocId);
    if (srcDoc) {
      try {
        const { url } = await renderThumbnail(
          srcDoc.arrayBuffer,
          updatedPage.sourcePageIndex,
          updatedPage.rotation,
          300
        );
        setPages((prev) =>
          prev.map((p) => (p.id === updatedPage.id ? { ...p, thumbnailUrl: url } : p))
        );
      } catch (e) {
        console.warn('Could not refresh thumbnail:', e);
      }
    }
    showStatus('COMMITTED ANNOTATIONS TO PAGE');
  };

  // Export full PDF
  const handleExport = useCallback(async () => {
    if (pages.length === 0) return;
    setIsExporting(true);

    try {
      const pdfBytes = await buildPdf(pages, sourceDocs, pageNumbering);
      const filename = docName.toLowerCase().endsWith('.pdf') ? docName : `${docName}.pdf`;
      downloadBytes(pdfBytes, filename);
      showStatus(`EXPORT COMPLETE: ${filename} (${pages.length} PAGES)`);
    } catch (err: any) {
      console.error('Export failed:', err);
      showStatus('ERROR: ' + (err.message || 'EXPORT FAILED'));
    } finally {
      setIsExporting(false);
    }
  }, [pages, sourceDocs, pageNumbering, docName, showStatus]);

  // Split document execution
  const handleExecuteSplit = async (options: SplitOptions) => {
    const baseName = docName.replace(/\.pdf$/i, '');

    if (options.mode === 'all-pages') {
      const zipBlob = await splitIntoZip(pages, sourceDocs, baseName);
      downloadBlob(zipBlob, `${baseName}_AllPages.zip`);
      showStatus(`BURST COMPLETE: ${pages.length} PAGES IN ZIP`);
    } else if (options.mode === 'ranges' && options.ranges) {
      const zipBlob = await splitByRangesToZip(options.ranges, pages, sourceDocs, baseName);
      downloadBlob(zipBlob, `${baseName}_Ranges.zip`);
      showStatus('PARTITION COMPLETE: RANGES IN ZIP');
    } else if (options.mode === 'selected') {
      const selected = pages.filter((p) => selectedPageIds.has(p.id));
      if (selected.length === 0) return;
      const pdfBytes = await buildPdf(selected, sourceDocs, pageNumbering);
      downloadBytes(pdfBytes, `${baseName}_Selected_${selected.length}p.pdf`);
      showStatus(`EXTRACTED ${selected.length} PAGES`);
    } else if (options.mode === 'by-document') {
      const zip = new JSZip();
      for (const [docId, doc] of sourceDocs.entries()) {
        const docPages = pages.filter((p) => p.sourceDocId === docId);
        if (docPages.length > 0) {
          const pdfBytes = await buildPdf(docPages, sourceDocs, pageNumbering);
          const safeName = doc.name.replace(/\.pdf$/i, '');
          zip.file(`${safeName}_edited.pdf`, pdfBytes);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}_BySourceDoc.zip`);
      showStatus(`SPLIT COMPLETE: ${sourceDocs.size} SOURCE DOCS`);
    }
  };

  // Reset workspace
  const handleReset = () => {
    if (pages.length === 0) return;
    if (window.confirm('Reset current workspace and clear all buffered pages?')) {
      setSourceDocs(new Map());
      setPages([]);
      setSelectedPageIds(new Set());
      setLastSelectedPageId(null);
      setDocName('merged_document.pdf');
      setStatusLog(null);
    }
  };

  // Workspace-level hotkeys (Ctrl+A, Delete, Ctrl+S, R, D)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (editingPage) return; // let editor modal handle its own keys

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Escape') {
        handleDeselectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExport();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateSelected('cw');
      } else if (e.key === 'd' || e.key === 'D') {
        handleDuplicateSelected();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    editingPage,
    handleSelectAll,
    handleDeselectAll,
    handleDeleteSelected,
    handleExport,
    handleRotateSelected,
    handleDuplicateSelected,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1d2021] text-[#ebdbb2]">
      {/* Header */}
      <Header
        pageCount={pages.length}
        docCount={sourceDocs.size}
        onReset={handleReset}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        {pages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-xl w-full">
              <Dropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoadingFiles}
              />
            </div>
          </div>
        ) : (
          <>
            <WorkspaceToolbar
              docName={docName}
              onDocNameChange={setDocName}
              selectedCount={selectedPageIds.size}
              totalCount={pages.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onSelectOdd={handleSelectOdd}
              onSelectEven={handleSelectEven}
              onRotateSelected={handleRotateSelected}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onOpenSplit={() => setIsSplitModalOpen(true)}
              onOpenPageNumbers={() => setIsPageNumbersModalOpen(true)}
              onExport={handleExport}
              onFilesSelected={handleFilesSelected}
              isExporting={isExporting}
              isLoadingFiles={isLoadingFiles}
              hasPageNumbersEnabled={pageNumbering.enabled}
            />

            <div className="flex-1">
              <PageGrid
                pages={pages}
                selectedPageIds={selectedPageIds}
                onToggleSelect={handleToggleSelect}
                onRotate={handleRotatePage}
                onDelete={handleDeletePage}
                onDuplicate={handleDuplicatePage}
                onEdit={(p) => setEditingPage(p)}
                onReorder={handleReorder}
              />
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <PageEditorModal
        page={editingPage}
        pdfArrayBuffer={
          editingPage ? sourceDocs.get(editingPage.sourceDocId)?.arrayBuffer || null : null
        }
        isOpen={Boolean(editingPage)}
        onClose={() => setEditingPage(null)}
        onSave={handleSaveEditedPage}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        totalPageCount={pages.length}
        selectedPageCount={selectedPageIds.size}
        docCount={sourceDocs.size}
        onExecuteSplit={handleExecuteSplit}
      />

      <PageNumberingModal
        isOpen={isPageNumbersModalOpen}
        onClose={() => setIsPageNumbersModalOpen(false)}
        options={pageNumbering}
        onChange={setPageNumbering}
      />

      {/* Telemetry Status Notification */}
      {statusLog && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-[#282828] text-[#fbf1c7] border border-[#504945] shadow-xl text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b8bb26] animate-pulse" />
          <span>{statusLog}</span>
        </div>
      )}
    </div>
  );
}
