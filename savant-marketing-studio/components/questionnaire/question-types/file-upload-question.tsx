'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

interface FileUploadQuestionProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  label: string;
  description?: string;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  error?: string;
}

export function FileUploadQuestion({
  value = [],
  onChange,
  label,
  description,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  error,
}: FileUploadQuestionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndAddFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        // Check file count
        if (value.length + newFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        // Check file size
        const sizeInMB = file.size / 1024 / 1024;
        if (sizeInMB > maxSizeInMB) {
          errors.push(`${file.name} exceeds ${maxSizeInMB}MB limit`);
          return;
        }

        // Add file
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        });
      });

      if (errors.length > 0) {
        setUploadError(errors[0]);
        setTimeout(() => setUploadError(undefined), 5000);
      } else {
        setUploadError(undefined);
        onChange([...value, ...newFiles]);
      }
    },
    [value, onChange, maxFiles, maxSizeInMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndAddFiles(e.dataTransfer.files);
    },
    [validateAndAddFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndAddFiles(e.target.files);
      e.target.value = ''; // Reset input
    },
    [validateAndAddFiles]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      onChange(value.filter((f) => f.id !== fileId));
    },
    [value, onChange]
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-info" />;
    if (type === 'application/pdf') return <FileText size={20} className="text-red-primary" />;
    return <File size={20} className="text-silver" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
        {description && (
          <p className="text-sm text-silver mb-4">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging
            ? 'border-red-primary bg-red-primary/5'
            : 'border-mid-gray hover:border-red-primary/50 bg-charcoal'
          }
          ${value.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={value.length >= maxFiles}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <Upload size={40} className="mx-auto mb-4 text-silver" />
        
        <p className="text-sm font-medium text-foreground mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-silver mb-2">
          or click to browse
        </p>
        <p className="text-xs text-slate">
          Max {maxFiles} files • Up to {maxSizeInMB}MB each
        </p>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="text-sm text-red-primary bg-red-primary/10 border border-red-primary/30 rounded-lg p-3">
          {error || uploadError}
        </div>
      )}

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-silver font-medium">
            Uploaded Files ({value.length}/{maxFiles})
          </p>
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 bg-charcoal border border-mid-gray rounded-lg p-3 hover:border-red-primary/50 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-silver">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="flex-shrink-0 p-1 hover:bg-red-primary/10 rounded transition-colors"
                aria-label="Remove file"
              >
                <X size={16} className="text-silver hover:text-red-primary" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
