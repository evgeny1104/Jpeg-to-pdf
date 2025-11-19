import React, { useState, useRef } from 'react';
import { ConversionMode, ConversionStatus, ProcessedFile } from './types';
import { convertPdfToJpeg, convertJpegToPdf, createZipFromFiles } from './utils/converter';
import { TabButton } from './components/TabButton';

const App: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>(ConversionMode.PDF_TO_JPEG);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResults([]);
      setStatus('idle');
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    try {
      if (mode === ConversionMode.PDF_TO_JPEG) {
        // Assume single PDF for now per request simplicity, or iterate
        const resultFiles = await convertPdfToJpeg(files[0]);
        setResults(resultFiles);
      } else {
        const resultFile = await convertJpegToPdf(files);
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
        {files.length === 0 && (
          <div 
            className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-slate-500">
              {mode === ConversionMode.PDF_TO_JPEG ? 'Выберите PDF файл' : 'Выберите изображения (JPEG)'}
            </span>
          </div>
        )}

        {/* File List Preview */}
        {files.length > 0 && status !== 'success' && (
          <div className="w-full space-y-2">
            <div className="bg-slate-50 p-3 rounded-md flex items-center justify-between border border-slate-200">
              <div className="flex items-center truncate">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-slate-700 truncate">
                  {files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`}
                </span>
              </div>
              <button onClick={reset} className="text-slate-400 hover:text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
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