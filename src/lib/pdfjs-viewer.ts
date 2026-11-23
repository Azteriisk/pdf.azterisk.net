'use client';

import { FormFieldItem } from './types';

// PDF.js client-side loader and renderer
let pdfjsLibInstance: any = null;

export async function getPdfjs() {
  if (typeof window === 'undefined') return null;

  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    pdfjsLibInstance = pdfjs;
  }
  return pdfjsLibInstance;
}

export async function getDocumentInfo(arrayBuffer: ArrayBuffer): Promise<{
  numPages: number;
  dimensions: Array<{ width: number; height: number }>;
}> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error('PDF.js not available');

  const bufferCopy = arrayBuffer.slice(0);
  const loadingTask = pdfjs.getDocument({ data: bufferCopy });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  const dimensions: Array<{ width: number; height: number }> = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    dimensions.push({ width: viewport.width, height: viewport.height });
  }

  return { numPages, dimensions };
}

export async function renderThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number, // 0-based
  rotation: number = 0,
  targetWidth: number = 320
): Promise<{ url: string; width: number; height: number }> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error('PDF.js not available');

  const bufferCopy = arrayBuffer.slice(0);
  const loadingTask = pdfjs.getDocument({ data: bufferCopy });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageIndex + 1);

  const unscaledViewport = page.getViewport({ scale: 1, rotation });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not get 2d context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  const url = canvas.toDataURL('image/jpeg', 0.85);

  canvas.width = 0;
  canvas.height = 0;

  return {
    url,
    width: unscaledViewport.width,
    height: unscaledViewport.height,
  };
}

export async function renderPageHighRes(
  arrayBuffer: ArrayBuffer,
  pageIndex: number, // 0-based
  rotation: number = 0,
  scale: number = 1.8,
  renderAnnotations: boolean = false
): Promise<{ url: string; width: number; height: number }> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error('PDF.js not available');

  const bufferCopy = arrayBuffer.slice(0);
  const loadingTask = pdfjs.getDocument({ data: bufferCopy });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageIndex + 1);

  const unscaledViewport = page.getViewport({ scale: 1, rotation });
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not get 2d context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
    annotationMode: renderAnnotations ? 1 : 0, // 0 = AnnotationMode.DISABLE (prevents double-vision ghosting with interactive HTML overlay)
  }).promise;

  const url = canvas.toDataURL('image/jpeg', 0.94);

  canvas.width = 0;
  canvas.height = 0;

  return {
    url,
    width: unscaledViewport.width,
    height: unscaledViewport.height,
  };
}

export async function getPageFormFields(
  arrayBuffer: ArrayBuffer,
  pageIndex: number, // 0-based
  rotation: number = 0
): Promise<FormFieldItem[]> {
  try {
    const pdfjs = await getPdfjs();
    if (!pdfjs) return [];

    const bufferCopy = arrayBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({ data: bufferCopy });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);

    const annotations = await page.getAnnotations();
    const fields: FormFieldItem[] = [];

    for (const a of annotations) {
      if (a.subtype === 'Widget' && a.fieldName) {
        const isCheckbox = a.checkBox || a.fieldType === 'Btn';
        const isChecked = isCheckbox && (a.fieldValue === 'Yes' || a.fieldValue === 'On' || a.fieldValue === true || a.buttonValue === true);
        fields.push({
          name: a.fieldName,
          type: isCheckbox ? 'checkbox' : 'text',
          value: isCheckbox ? isChecked : (a.fieldValue || ''),
          rect: [a.rect[0], a.rect[1], a.rect[2], a.rect[3]],
        });
      }
    }

    return fields;
  } catch (err) {
    console.warn('Could not extract form fields for page:', err);
    return [];
  }
}
