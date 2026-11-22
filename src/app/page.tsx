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
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [sourceDocs, setSourceDocs] = useState<Map<string, SourceDocument>>(new Map());
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [docName, setDocName] = useState('merged_document.pdf');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [editingPage, setEditingPage] = useState<WorkspacePage | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isPageNumbersModalOpen, setIsPageNumbersModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Page numbering options
  const [pageNumbering, setPageNumbering] = useState<PageNumberingOptions>({
    enabled: false,
    position: 'bottom-center',
    format: 'Page {n} of {total}',
    fontSize: 10,
    color: '#504945',
    startNumber: 1,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

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

        // Query document info
        const { numPages, dimensions } = await getDocumentInfo(arrayBuffer);

        const sourceDoc: SourceDocument = {
          id: fileId,
          name: file.name,
          size: file.size,
          arrayBuffer,
          pageCount: numPages,
        };
        newSourceDocs.set(fileId, sourceDoc);

        // Generate pages and their thumbnails
        for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
          const pageId = `${fileId}_p${pageIdx + 1}_${generateId()}`;
          const dim = dimensions[pageIdx] || { width: 595, height: 842 };

          // Render thumbnail
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

      // If first file, adapt filename
      if (pages.length === 0 && files.length > 0) {
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setDocName(files.length === 1 ? `${base}_edited.pdf` : `${base}_merged.pdf`);
      }

      showToast(`Added ${files.length} document${files.length > 1 ? 's' : ''} (${newPages.length} pages total)`);
    } catch (err: any) {
      console.error('Error loading PDF files:', err);
      showToast('Error loading one or more PDF files. Please ensure they are valid PDFs.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (pageId: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPageIds(new Set(pages.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPageIds(new Set());
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
  const handleRotateSelected = () => {
    const targetIds = selectedPageIds.size > 0 ? selectedPageIds : new Set(pages.map((p) => p.id));
    setPages((prev) =>
      prev.map((p) => {
        if (!targetIds.has(p.id)) return p;
        return {
          ...p,
          rotation: (p.rotation + 90) % 360,
        };
      })
    );
    showToast(`Rotated ${targetIds.size} page${targetIds.size > 1 ? 's' : ''} 90°`);
  };

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
  const handleDeleteSelected = () => {
    if (selectedPageIds.size === 0) return;
    const count = selectedPageIds.size;
    setPages((prev) => prev.filter((p) => !selectedPageIds.has(p.id)));
    setSelectedPageIds(new Set());
    showToast(`Deleted ${count} page${count > 1 ? 's' : ''}`);
  };

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
    showToast('Page duplicated');
  };

  // Duplicate selected pages
  const handleDuplicateSelected = () => {
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
    showToast(`Duplicated ${selectedPageIds.size} page${selectedPageIds.size > 1 ? 's' : ''}`);
  };

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

    // Re-render thumbnail to reflect updated rotation/annotations
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
    showToast('Page changes applied');
  };

  // Export full PDF
  const handleExport = async () => {
    if (pages.length === 0) return;
    setIsExporting(true);

    try {
      const pdfBytes = await buildPdf(pages, sourceDocs, pageNumbering);
      const filename = docName.toLowerCase().endsWith('.pdf') ? docName : `${docName}.pdf`;
      downloadBytes(pdfBytes, filename);
      showToast(`Exported ${filename} (${pages.length} pages)`);
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast('Failed to export PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // Execute Split modal action
  const handleExecuteSplit = async (options: SplitOptions) => {
    const baseName = docName.replace(/\.pdf$/i, '');

    if (options.mode === 'all-pages') {
      const zipBlob = await splitIntoZip(pages, sourceDocs, baseName);
      downloadBlob(zipBlob, `${baseName}_AllPages_Split.zip`);
      showToast(`Exported ${pages.length} individual pages as a ZIP`);
    } else if (options.mode === 'ranges' && options.ranges) {
      const zipBlob = await splitByRangesToZip(options.ranges, pages, sourceDocs, baseName);
      downloadBlob(zipBlob, `${baseName}_Ranges_Split.zip`);
      showToast(`Exported custom ranges as a ZIP`);
    } else if (options.mode === 'selected') {
      const selected = pages.filter((p) => selectedPageIds.has(p.id));
      if (selected.length === 0) return;
      const pdfBytes = await buildPdf(selected, sourceDocs, pageNumbering);
      downloadBytes(pdfBytes, `${baseName}_Selected_${selected.length}p.pdf`);
      showToast(`Exported ${selected.length} selected pages`);
    } else if (options.mode === 'by-document') {
      // Split by original document
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
      downloadBlob(zipBlob, `${baseName}_ByDocument.zip`);
      showToast(`Exported split files by original document as a ZIP`);
    }
  };

  // Reset workspace
  const handleReset = () => {
    if (pages.length === 0) return;
    if (window.confirm('Start a new session? This will clear all uploaded pages and unsaved edits.')) {
      setSourceDocs(new Map());
      setPages([]);
      setSelectedPageIds(new Set());
      setDocName('merged_document.pdf');
      setToastMessage(null);
    }
  };

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
          // Empty State / Hero Dropzone
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-2xl w-full">
              <Dropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoadingFiles}
              />
            </div>
          </div>
        ) : (
          // Active Workspace
          <>
            <WorkspaceToolbar
              docName={docName}
              onDocNameChange={setDocName}
              selectedCount={selectedPageIds.size}
              totalCount={pages.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#282828] text-[#fbf1c7] border border-[#504945] shadow-2xl animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#b8bb26] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
