import { ProcessedFile } from '../types';

// PDF to JPEG Conversion
export const convertPdfToJpeg = async (file: File): Promise<ProcessedFile[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const results: ProcessedFile[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better quality
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const blob = await (await fetch(dataUrl)).blob();

    results.push({
      name: `${file.name.replace('.pdf', '')}_стр_${i}.jpg`,
      url: URL.createObjectURL(blob),
      blob: blob,
    });
  }

  return results;
};

// JPEG to PDF Conversion
export const convertJpegToPdf = async (files: File[]): Promise<ProcessedFile> => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imgData = await readFileAsDataURL(file);
    const imgProps = await getImageProperties(imgData);

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    // Calculate aspect ratio to fit page
    const widthRatio = pdfWidth / imgProps.width;
    const heightRatio = pdfHeight / imgProps.height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    const w = imgProps.width * ratio;
    const h = imgProps.height * ratio;
    
    // Center image
    const x = (pdfWidth - w) / 2;
    const y = (pdfHeight - h) / 2;

    if (i > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'JPEG', x, y, w, h);
  }

  const pdfBlob = doc.output('blob');
  return {
    name: 'converted_document.pdf',
    url: URL.createObjectURL(pdfBlob),
    blob: pdfBlob
  };
};

// Helper: Create ZIP for multiple images
export const createZipFromFiles = async (files: ProcessedFile[]): Promise<ProcessedFile> => {
    const zip = new window.JSZip();
    files.forEach(f => {
        zip.file(f.name, f.blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    return {
        name: "images.zip",
        url: URL.createObjectURL(content),
        blob: content
    };
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getImageProperties = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
};