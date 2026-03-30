import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface CSVDropZoneProps {
  onFileSelected: (file: File) => void;
}

export default function CSVDropZone({ onFileSelected }: CSVDropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed
        p-12 transition-colors cursor-pointer
        ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
        ${isDragReject ? 'border-red-400 bg-red-50' : ''}
        ${!isDragActive && !selectedFile ? 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100' : ''}
        ${selectedFile && !isDragActive ? 'border-green-400 bg-green-50' : ''}
      `}
    >
      <input {...getInputProps()} />

      {selectedFile ? (
        <>
          <FileSpreadsheet className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Drop another file or click to replace
            </p>
          </div>
        </>
      ) : (
        <>
          <Upload
            className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragActive
                ? 'Drop your CSV file here'
                : 'Drag & drop a CSV file here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Only .csv files are accepted</p>
          </div>
        </>
      )}
    </div>
  );
}
