'use client';

import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFTextField,
  PDFCheckBox,
} from 'pdf-lib';
import JSZip from 'jszip';
import {
  SourceDocument,
  WorkspacePage,
  PageNumberingOptions,
  PageAnnotation,
  TextAnnotation,
  HighlightAnnotation,
  RedactAnnotation,
  ImageAnnotation,
  DrawAnnotation,
  StampAnnotation,
  CheckmarkAnnotation,
} from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; format: 'png' | 'jpg' } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const format = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';

  const binaryString = atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, format };
}

async function applyAnnotationsToPage(
  destDoc: PDFDocument,
  page: any,
  annotations: PageAnnotation[],
  originalWidth: number,
  originalHeight: number
) {
  if (!annotations || annotations.length === 0) return;

  // Embed standard base fonts
  const fontMap = {
    helvetica: await destDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await destDoc.embedFont(StandardFonts.HelveticaBold),
    helveticaOblique: await destDoc.embedFont(StandardFonts.HelveticaOblique),
    helveticaBoldOblique: await destDoc.embedFont(StandardFonts.HelveticaBoldOblique),

    times: await destDoc.embedFont(StandardFonts.TimesRoman),
    timesBold: await destDoc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await destDoc.embedFont(StandardFonts.TimesRomanItalic),
    timesBoldItalic: await destDoc.embedFont(StandardFonts.TimesRomanBoldItalic),

    courier: await destDoc.embedFont(StandardFonts.Courier),
    courierBold: await destDoc.embedFont(StandardFonts.CourierBold),
    courierOblique: await destDoc.embedFont(StandardFonts.CourierOblique),
    courierBoldOblique: await destDoc.embedFont(StandardFonts.CourierBoldOblique),
  };

  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const scaleX = pageWidth / (originalWidth || pageWidth);
  const scaleY = pageHeight / (originalHeight || pageHeight);

  for (const ann of annotations) {
    try {
      if (ann.type === 'draw') {
        const drawAnn = ann as DrawAnnotation;
        if (!drawAnn.points || drawAnn.points.length < 2) continue;

        const color = hexToRgb(drawAnn.color);
        const strokeWidth = (drawAnn.strokeWidth || 3) * ((scaleX + scaleY) / 2);

        for (let i = 0; i < drawAnn.points.length - 1; i++) {
          const p1 = drawAnn.points[i];
          const p2 = drawAnn.points[i + 1];

          page.drawLine({
            start: {
              x: p1.x * scaleX,
              y: pageHeight - p1.y * scaleY,
            },
            end: {
              x: p2.x * scaleX,
              y: pageHeight - p2.y * scaleY,
            },
            thickness: strokeWidth,
            color: rgb(color.r, color.g, color.b),
            opacity: drawAnn.opacity ?? 1,
          });
        }
      } else if (ann.type === 'highlight') {
        const hAnn = ann as HighlightAnnotation;
        const color = hexToRgb(hAnn.color || '#fabd2f');
        const x = hAnn.x * scaleX;
        const width = hAnn.width * scaleX;
        const height = hAnn.height * scaleY;
        const y = pageHeight - (hAnn.y * scaleY + height);

        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: rgb(color.r, color.g, color.b),
          opacity: hAnn.opacity || 0.35,
        });
      } else if (ann.type === 'redact') {
        const rAnn = ann as RedactAnnotation;
        const color = hexToRgb(rAnn.color || '#000000');
        const x = rAnn.x * scaleX;
        const width = rAnn.width * scaleX;
        const height = rAnn.height * scaleY;
        const y = pageHeight - (rAnn.y * scaleY + height);

        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: rgb(color.r, color.g, color.b),
          opacity: 1,
        });
      } else if (ann.type === 'text') {
        const tAnn = ann as TextAnnotation;
        if (!tAnn.text) continue;
        const color = hexToRgb(tAnn.color || '#1d2021');

        // Select exact font style based on family and bold/italic
        const fam = tAnn.fontFamily || 'helvetica';
        let chosenFont = fontMap.helvetica;
        if (fam === 'times') {
          if (tAnn.isBold && tAnn.isItalic) chosenFont = fontMap.timesBoldItalic;
          else if (tAnn.isBold) chosenFont = fontMap.timesBold;
          else if (tAnn.isItalic) chosenFont = fontMap.timesItalic;
          else chosenFont = fontMap.times;
        } else if (fam === 'courier') {
          if (tAnn.isBold && tAnn.isItalic) chosenFont = fontMap.courierBoldOblique;
          else if (tAnn.isBold) chosenFont = fontMap.courierBold;
          else if (tAnn.isItalic) chosenFont = fontMap.courierOblique;
          else chosenFont = fontMap.courier;
        } else {
          if (tAnn.isBold && tAnn.isItalic) chosenFont = fontMap.helveticaBoldOblique;
          else if (tAnn.isBold) chosenFont = fontMap.helveticaBold;
          else if (tAnn.isItalic) chosenFont = fontMap.helveticaOblique;
          else chosenFont = fontMap.helvetica;
        }

        const fontSize = (tAnn.size || 14) * ((scaleX + scaleY) / 2);
        const textWidth = chosenFont.widthOfTextAtSize(tAnn.text, fontSize);
        const textHeight = fontSize * 1.2;

        const x = tAnn.x * scaleX;
        const y = pageHeight - (tAnn.y * scaleY) - fontSize * 0.85;

        // Opaque whiteout background behind text to cover lines on worksheets
        if (tAnn.hasBackground) {
          page.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: textWidth + 4,
            height: textHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
          });
        }

        page.drawText(tAnn.text, {
          x,
          y,
          size: fontSize,
          font: chosenFont,
          color: rgb(color.r, color.g, color.b),
        });
      } else if (ann.type === 'checkmark') {
        const cAnn = ann as CheckmarkAnnotation;
        const color = hexToRgb(cAnn.color || '#1d2021');
        const size = (cAnn.size || 16) * ((scaleX + scaleY) / 2);
        const x = cAnn.x * scaleX;
        const y = pageHeight - (cAnn.y * scaleY);

        if (cAnn.markType === 'cross') {
          // Draw crisp X mark
          const half = size / 2;
          page.drawLine({
            start: { x: x - half, y: y + half },
            end: { x: x + half, y: y - half },
            thickness: 2 * scaleX,
            color: rgb(color.r, color.g, color.b),
          });
          page.drawLine({
            start: { x: x - half, y: y - half },
            end: { x: x + half, y: y + half },
            thickness: 2 * scaleX,
            color: rgb(color.r, color.g, color.b),
          });
        } else if (cAnn.markType === 'dot') {
          // Draw circle/dot
          page.drawCircle({
            x,
            y,
            size: size / 3,
            color: rgb(color.r, color.g, color.b),
          });
        } else {
          // Draw standard checkmark (✓) with two line segments
          const stemStart = { x: x - size * 0.4, y: y };
          const vertex = { x: x - size * 0.1, y: y - size * 0.35 };
          const stemEnd = { x: x + size * 0.45, y: y + size * 0.4 };

          page.drawLine({
            start: stemStart,
            end: vertex,
            thickness: 2.2 * scaleX,
            color: rgb(color.r, color.g, color.b),
          });
          page.drawLine({
            start: vertex,
            end: stemEnd,
            thickness: 2.2 * scaleX,
            color: rgb(color.r, color.g, color.b),
          });
        }
      } else if (ann.type === 'stamp') {
        const sAnn = ann as StampAnnotation;
        const color = hexToRgb(sAnn.color || '#cc241d');
        const x = sAnn.x * scaleX;
        const width = sAnn.width * scaleX;
        const height = sAnn.height * scaleY;
        const y = pageHeight - (sAnn.y * scaleY + height);

        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: 2 * ((scaleX + scaleY) / 2),
          color: rgb(color.r, color.g, color.b),
          opacity: 0.1,
        });

        const stampFontSize = Math.min(height * 0.45, width / (sAnn.text.length * 0.65));
        const boldFont = fontMap.helveticaBold;
        const textWidth = boldFont.widthOfTextAtSize(sAnn.text, stampFontSize);
        const textX = x + (width - textWidth) / 2;
        const textY = y + (height - stampFontSize) / 2;

        page.drawText(sAnn.text, {
          x: textX,
          y: textY,
          size: stampFontSize,
          font: boldFont,
          color: rgb(color.r, color.g, color.b),
        });
      } else if (ann.type === 'image') {
        const iAnn = ann as ImageAnnotation;
        if (!iAnn.dataUrl) continue;
        const { bytes, format } = dataUrlToBytes(iAnn.dataUrl);

        let embeddedImage;
        if (format === 'png') {
          embeddedImage = await destDoc.embedPng(bytes);
        } else {
          embeddedImage = await destDoc.embedJpg(bytes);
        }

        const x = iAnn.x * scaleX;
        const width = iAnn.width * scaleX;
        const height = iAnn.height * scaleY;
        const y = pageHeight - (iAnn.y * scaleY + height);

        page.drawImage(embeddedImage, {
          x,
          y,
          width,
          height,
        });
      }
    } catch (err) {
      console.warn('Error applying annotation:', ann, err);
    }
  }
}

export async function buildPdf(
  pagesToExport: WorkspacePage[],
  sourceDocsMap: Map<string, SourceDocument>,
  pageNumbering?: PageNumberingOptions
): Promise<Uint8Array> {
  if (pagesToExport.length === 0) {
    throw new Error('No pages selected to export');
  }

  const destDoc = await PDFDocument.create();

  // Load and cache source docs; apply any form values
  const cachedSourceDocs = new Map<string, PDFDocument>();

  for (const page of pagesToExport) {
    let srcDoc = cachedSourceDocs.get(page.sourceDocId);
    if (!srcDoc) {
      const sourceDoc = sourceDocsMap.get(page.sourceDocId);
      if (!sourceDoc) {
        throw new Error(`Source document not found for page: ${page.id}`);
      }
      srcDoc = await PDFDocument.load(sourceDoc.arrayBuffer);
      cachedSourceDocs.set(page.sourceDocId, srcDoc);
    }

    // Apply interactive form field values if present
    if (page.formValues && Object.keys(page.formValues).length > 0) {
      try {
        const form = srcDoc.getForm();
        for (const [fieldName, val] of Object.entries(page.formValues)) {
          try {
            const field = form.getField(fieldName);
            if (field instanceof PDFTextField) {
              field.setText(String(val));
            } else if (field instanceof PDFCheckBox) {
              if (val) field.check();
              else field.uncheck();
            }
          } catch {
            // field might belong to another page
          }
        }
      } catch {
        // no form fields
      }
    }

    const [copiedPage] = await destDoc.copyPages(srcDoc, [page.sourcePageIndex]);

    const currentAngle = copiedPage.getRotation().angle;
    const finalAngle = (currentAngle + (page.rotation || 0)) % 360;
    copiedPage.setRotation(degrees(finalAngle));

    // Apply drawings, highlights, text (in base font), checkmarks, redactions, signatures
    await applyAnnotationsToPage(
      destDoc,
      copiedPage,
      page.annotations,
      page.originalWidth,
      page.originalHeight
    );

    destDoc.addPage(copiedPage);
  }

  // Stamp header/footer page numbers
  if (pageNumbering && pageNumbering.enabled) {
    const font = await destDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = destDoc.getPageCount();
    const color = hexToRgb(pageNumbering.color || '#504945');
    const fontSize = pageNumbering.fontSize || 10;
    const startNum = pageNumbering.startNumber || 1;

    for (let i = 0; i < totalPages; i++) {
      const p = destDoc.getPage(i);
      const pWidth = p.getWidth();
      const pHeight = p.getHeight();
      const pageNum = startNum + i;

      let text = pageNumbering.format
        .replace('{n}', String(pageNum))
        .replace('{total}', String(totalPages));

      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x = pWidth / 2 - textWidth / 2;
      let y = 20;

      if (pageNumbering.position === 'bottom-left') {
        x = 30;
        y = 20;
      } else if (pageNumbering.position === 'bottom-right') {
        x = pWidth - textWidth - 30;
        y = 20;
      } else if (pageNumbering.position === 'top-center') {
        x = pWidth / 2 - textWidth / 2;
        y = pHeight - 25;
      } else if (pageNumbering.position === 'top-right') {
        x = pWidth - textWidth - 30;
        y = pHeight - 25;
      }

      p.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    }
  }

  return await destDoc.save();
}

export async function splitIntoZip(
  pages: WorkspacePage[],
  sourceDocsMap: Map<string, SourceDocument>,
  baseName: string = 'Document'
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < pages.length; i++) {
    const singlePageBytes = await buildPdf([pages[i]], sourceDocsMap);
    const fileName = `${baseName}_Page_${i + 1}.pdf`;
    zip.file(fileName, singlePageBytes);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function splitByRangesToZip(
  rangesStr: string,
  pages: WorkspacePage[],
  sourceDocsMap: Map<string, SourceDocument>,
  baseName: string = 'Document'
): Promise<Blob> {
  const zip = new JSZip();
  const ranges = rangesStr.split(',').map((r) => r.trim()).filter(Boolean);

  for (let idx = 0; idx < ranges.length; idx++) {
    const range = ranges[idx];
    const pageIndices: number[] = [];

    if (range.includes('-')) {
      const [startStr, endStr] = range.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(pages.length, parseInt(endStr, 10));
      for (let p = start; p <= end; p++) {
        pageIndices.push(p - 1);
      }
    } else {
      const p = parseInt(range, 10);
      if (!isNaN(p) && p >= 1 && p <= pages.length) {
        pageIndices.push(p - 1);
      }
    }

    if (pageIndices.length > 0) {
      const selectedPages = pageIndices.map((i) => pages[i]).filter(Boolean);
      const pdfBytes = await buildPdf(selectedPages, sourceDocsMap);
      const fileName = `${baseName}_Range_${range.replace(/\s+/g, '')}.pdf`;
      zip.file(fileName, pdfBytes);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
