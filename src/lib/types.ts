export interface SourceDocument {
  id: string;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
}

export type AnnotationType = 'draw' | 'highlight' | 'text' | 'redact' | 'image' | 'stamp' | 'checkmark';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw';
  points: Array<{ x: number; y: number }>;
  strokeWidth: number;
  color: string; // hex
  opacity: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  fontFamily?: 'helvetica' | 'times' | 'courier';
  isBold?: boolean;
  isItalic?: boolean;
  hasBackground?: boolean;
}

export interface CheckmarkAnnotation extends BaseAnnotation {
  type: 'checkmark';
  markType: 'check' | 'cross' | 'dot';
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface RedactAnnotation extends BaseAnnotation {
  type: 'redact';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // usually #000000 or #ffffff
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export type PageAnnotation =
  | DrawAnnotation
  | HighlightAnnotation
  | TextAnnotation
  | CheckmarkAnnotation
  | RedactAnnotation
  | ImageAnnotation
  | StampAnnotation;

export interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox';
  value: string | boolean;
  rect: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface WorkspacePage {
  id: string;
  sourceDocId: string;
  sourceDocName: string;
  sourcePageIndex: number; // 0-based
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
  originalWidth: number;
  originalHeight: number;
  annotations: PageAnnotation[];
  formValues?: Record<string, string | boolean>;
}

export interface PageNumberingOptions {
  enabled: boolean;
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';
  format: 'Page {n} of {total}' | 'Page {n}' | '{n}';
  fontSize: number;
  color: string;
  startNumber: number;
}

export interface SplitOptions {
  mode: 'all-pages' | 'ranges' | 'selected' | 'by-document';
  ranges?: string; // e.g. "1-2, 3-5"
}
