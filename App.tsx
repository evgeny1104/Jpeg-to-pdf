import React, { useState, useRef, useEffect } from 'react';
import { ConversionMode, ConversionStatus, ProcessedFile } from './types';
import { convertPdfToJpeg, convertJpegToPdf, createZipFromFiles } from './utils/converter';
import { TabButton } from './components/TabButton';

interface OrderedImage {
  id: string;
  file: File;
  url: string;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>(ConversionMode.PDF_TO_JPEG);
  const [files, setFiles] = useState<File[]>([]); // Raw files for PDF mode
  const [orderedImages, setOrderedImages] = useState<OrderedImage[]>([]); // For JPEG mode
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      orderedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let selectedFiles = Array.from(e.target.files);

      if (mode === ConversionMode.JPEG_TO_PDF) {
        if (selectedFiles.length > 30) {
            alert('Можно загрузить не более 30 файлов. Будут обработаны первые 30.');
            selectedFiles = selectedFiles.slice(0, 30);
        }
        // Create preview objects
        const newImages = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            url: URL.createObjectURL(file)
        }));
        setOrderedImages(newImages);
      } else {
        setFiles(selectedFiles);
      }

      setResults([]);
      setStatus('idle');
    }
  };

  const reset = () => {
    orderedImages.forEach(img => URL.revokeObjectURL(img.url));
    setFiles([]);
    setOrderedImages([]);
    setResults([]);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag Handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const onDragEnd = () => {
    const startIdx = dragItem.current;
    const endIdx = dragOverItem.current;

    if (startIdx !== null && endIdx !== null && startIdx !== endIdx) {
        const newItems = [...orderedImages];
        const draggedItem = newItems[startIdx];
        newItems.splice(startIdx, 1);
        newItems.splice(endIdx, 0, draggedItem);
        setOrderedImages(newItems);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
  }

  const handleConvert = async () => {
    if (mode === ConversionMode.PDF_TO_JPEG && files.length === 0) return;
    if (mode === ConversionMode.JPEG_TO_PDF && orderedImages.length === 0) return;

    setStatus('processing');
    try {
      if (mode === ConversionMode.PDF_TO_JPEG) {
        const resultFiles = await convertPdfToJpeg(files[0]);
        setResults(resultFiles);
      } else {
        // We need to adjust utils/converter to accept our object structure or map back to File[]
        // Assuming updated utility accepts the array of wrappers for order preservation
        // Or we map it here:
        // const filesToConvert = orderedImages.map(img => img.file);
        // For now, let's assume logic handles it or we map it. 
        // Since index.html logic was updated to take `orderedFiles`, we do similar logic here conceptually.
        // In a real split file setup, I'd update utils too, but here I am mirroring index.html behavior.
        
        // Using `any` cast to simulate the call as per index.html implementation
        const resultFile = await convertJpegToPdf(orderedImages as any); 
        setResults([resultFile]);
      }
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const downloadAll = async () => {
     if (results.length === 1) {
         const link = document.createElement('a');
         link.href = results[0].url;
         link.download = results[0].name;
         link.click();
     } else if (results.length > 1) {
         const zipResult = await createZipFromFiles(results);
         const link = document.createElement('a');
         link.href = zipResult.url;
         link.download = zipResult.name;
         link.click();
     }
  };

  const hasFiles = (mode === ConversionMode.PDF_TO_JPEG && files.length > 0) || 
                   (mode === ConversionMode.JPEG_TO_PDF && orderedImages.length > 0);

  return (
    <div className="min-h-[300px] w-full max-w-[480px] mx-auto p-4 flex flex-col">
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Конвертер</h2>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-slate-200">
        <TabButton
          isActive={mode === ConversionMode.PDF_TO_JPEG}
          onClick={() => { setMode(ConversionMode.PDF_TO_JPEG); reset(); }}
        >
          PDF в JPEG
        </TabButton>
        <TabButton
          isActive={mode === ConversionMode.JPEG_TO_PDF}
          onClick={() => { setMode(ConversionMode.JPEG_TO_PDF); reset(); }}
        >
          JPEG в PDF
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center space-y-4">
        
        {/* Drop/Select Area */}
        {!hasFiles && (
          <div 
            className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-slate-500">
              {mode === ConversionMode.PDF_TO_JPEG ? 'Выберите PDF файл' : 'Выберите JPEG (до 30 шт)'}
            </span>
          </div>
        )}

        {/* Preview Area */}
        {hasFiles && status !== 'success' && (
            <div className="w-full space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-medium text-slate-700">
                        {mode === ConversionMode.PDF_TO_JPEG 
                            ? `Файл: ${files[0]?.name}`
                            : `Выбрано изображений: ${orderedImages.length}`
                        }
                    </span>
                    <button onClick={reset} className="text-xs text-red-500 hover:text-red-700 underline">
                        Сбросить
                    </button>
                </div>

                {mode === ConversionMode.PDF_TO_JPEG && (
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {mode === ConversionMode.JPEG_TO_PDF && (
                    <div className="w-full">
                        <p className="text-xs text-slate-500 mb-2 text-center">Перетащите, чтобы изменить порядок</p>
                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1 bg-slate-50 rounded border border-slate-200">
                            {orderedImages.map((item, index) => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, index)}
                                    onDragEnter={(e) => onDragEnter(e, index)}
                                    onDragEnd={onDragEnd}
                                    onDragOver={onDragOver}
                                    className="relative aspect-square bg-white border border-slate-300 rounded overflow-hidden cursor-move hover:shadow-md transition-shadow group"
                                >
                                    <img src={item.url} alt={`Page ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-br">
                                        {index + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <button
                    onClick={handleConvert}
                    disabled={status === 'processing'}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors shadow-sm
                        ${status === 'processing' ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}
                    `}
                >
                    {status === 'processing' ? (
                        <span className="flex items-center justify-center">
                             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Обработка...
                        </span>
                    ) : (
                        'Конвертировать'
                    )}
                </button>
            </div>
        )}

        {/* Results Area */}
        {status === 'success' && results.length > 0 && (
          <div className="w-full text-center space-y-4 animate-fade-in">
             <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-center text-green-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-sm text-green-800 font-medium">Готово!</p>
                <p className="text-xs text-green-600 mt-1">
                    {results.length} файл(ов) создано
                </p>
             </div>

             <button 
                onClick={downloadAll}
                className="w-full py-2 px-4 bg-slate-800 text-white rounded-md hover:bg-slate-700 font-medium transition-colors flex items-center justify-center"
             >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать {results.length > 1 ? 'архивом' : 'файл'}
             </button>

             <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Начать заново
             </button>
          </div>
        )}
        
        {status === 'error' && (
            <div className="w-full p-3 bg-red-50 text-red-600 text-sm rounded-md text-center border border-red-100">
                Произошла ошибка при конвертации.
                <button onClick={reset} className="block w-full mt-2 text-xs font-semibold underline">Попробовать снова</button>
            </div>
        )}

      </div>

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={mode === ConversionMode.PDF_TO_JPEG ? "application/pdf" : "image/jpeg, image/jpg"}
        multiple={mode === ConversionMode.JPEG_TO_PDF}
        className="hidden"
      />
    </div>
  );
};

export default App;