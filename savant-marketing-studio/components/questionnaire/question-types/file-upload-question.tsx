'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, AlertCircle } from 'lucide-react';

// Allowed file types for uploads (must match server validation)
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

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

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name} - only PDF and images allowed`);
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
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-info" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-primary" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isDisabled = value.length >= maxFiles;

  return (
    <div className="space-y-4">
      {/* Description if provided */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative min-h-[120px]
          border-2 border-dashed rounded-lg
          flex flex-col items-center justify-center
          p-8 text-center
          transition-all duration-200
          ${isDragging
            ? 'border-solid border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={isDisabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <Upload className={`
          w-8 h-8 mb-3
          transition-colors duration-200
          ${isDragging ? 'text-primary' : 'text-muted-foreground'}
        `} />
        
        <p className="text-sm font-medium text-foreground mb-1">
          {isDragging ? 'Drop files here' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground/70">
          Max {maxFiles} files · Up to {maxSizeInMB}MB each · PDF and images
        </p>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {value.length} of {maxFiles} files uploaded
          </p>
          {value.map((file) => (
            <div
              key={file.id}
              className="
                flex items-center gap-3 
                py-3 px-4 
                bg-muted/30 rounded-lg
                border-2 border-transparent
                hover:border-muted-foreground/20
                transition-all duration-200
                group
              "
            >
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="
                  flex-shrink-0 p-1.5 rounded
                  text-muted-foreground 
                  hover:text-destructive hover:bg-destructive/10
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                "
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
