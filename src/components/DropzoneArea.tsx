import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Search } from 'lucide-react';

export const DropzoneArea = ({ onDropFiles }: { onDropFiles: (files: File[]) => void }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDropFiles(acceptedFiles);
    }
  }, [onDropFiles]);

  // @ts-ignore - The react-dropzone types might complain about missing HTML attributes, ignoring as it's an internal library type mismatch.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  return (
    <div 
      {...getRootProps()}
      tabIndex={0}
      aria-label="Área de upload de arquivos"
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[160px] flex flex-col items-center justify-center ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
          : 'border-slate-300 bg-white hover:bg-slate-50'
      }`}
    >
      <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true" />
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste e solte seus arquivos aqui'}
      </h3>
      <p className="text-sm text-slate-500 mb-6">ou clique na área para selecionar do seu computador</p>
      
      <div className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2 shadow-sm min-h-[44px]">
        <Search className="w-4 h-4" aria-hidden="true" /> Procurar Arquivos
      </div>
      <input {...getInputProps()} className="sr-only" aria-hidden="true" />
      <p className="text-xs text-slate-400 mt-4">Formatos suportados: PDF, Word, Excel. Tamanho máximo: 5MB por arquivo.</p>
      <span className="sr-only">Selecione arquivos ou arraste para esta área.</span>
    </div>
  );
};
