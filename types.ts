export enum ConversionMode {
  PDF_TO_JPEG = 'PDF_TO_JPEG',
  JPEG_TO_PDF = 'JPEG_TO_PDF'
}

export interface ProcessedFile {
  name: string;
  url: string;
  blob: Blob;
}

export type ConversionStatus = 'idle' | 'processing' | 'success' | 'error';

// Augment window for CDN libraries
declare global {
  interface Window {
    pdfjsLib: any;
    jspdf: {
      jsPDF: any;
    };
    JSZip: any;
  }
}