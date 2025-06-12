/**
 * File Drop Zone component for drag & drop file uploads
 * Supports TM7 and JSON file formats with visual feedback
 */

import React, { useState, useRef, useCallback } from 'react';

export interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onDrop, 
  accept = '.tm7,.json', 
  multiple = false,
  children,
  className = '',
  maxSize = 50 * 1024 * 1024, // 50MB default
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const acceptedTypes = accept.split(',').map(type => type.trim());

  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    const extension = '.' + file.name.toLowerCase().split('.').pop();
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} is not supported. Expected: ${accept}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1);
      const fileMB = (file.size / 1024 / 1024).toFixed(1);
      return `File size ${fileMB}MB exceeds maximum allowed size of ${maxMB}MB`;
    }

    return null;
  }, [acceptedTypes, accept, maxSize]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    setError(null);
    setIsProcessing(true);

    try {
      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate each file
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      // Show validation errors
      if (errors.length > 0) {
        setError(errors.join('\n'));
        setIsProcessing(false);
        return;
      }

      // Process files
      const filesToProcess = multiple ? validFiles : [validFiles[0]];
      if (filesToProcess.length > 0) {
        onDrop(filesToProcess);
      }
    } catch (error) {
      setError(`Error processing files: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [multiple, onDrop, validateFile, disabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    setIsDragOver(false);
    dragCounterRef.current = 0;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFiles(files);
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick, disabled]);

  const getDropZoneClass = () => {
    const baseClass = 'file-drop-zone';
    const classes = [baseClass, className];
    
    if (isDragOver) classes.push(`${baseClass}--drag-over`);
    if (isProcessing) classes.push(`${baseClass}--processing`);
    if (disabled) classes.push(`${baseClass}--disabled`);
    if (error) classes.push(`${baseClass}--error`);
    
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div
      className={getDropZoneClass()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Drop zone for ${accept} files`}
      aria-disabled={disabled}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
        aria-hidden="true"
      />
      
      {children || (
        <div className="file-drop-zone__content">
          <div className="file-drop-zone__icon">
            {isProcessing ? '⏳' : isDragOver ? '📂' : '📁'}
          </div>
          
          <div className="file-drop-zone__text">
            {isProcessing ? (
              'Processing files...'
            ) : isDragOver ? (
              'Drop files here'
            ) : (
              <>
                Drop {accept.toUpperCase()} files here or{' '}
                <span className="file-drop-zone__link">click to browse</span>
              </>
            )}
          </div>
          
          <div className="file-drop-zone__hint">
            Supports {accept.replace(/\./g, '').toUpperCase()} files
            {maxSize < Infinity && (
              ` up to ${(maxSize / 1024 / 1024).toFixed(0)}MB`
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="file-drop-zone__error">
          <div className="file-drop-zone__error-icon">⚠️</div>
          <div className="file-drop-zone__error-text">{error}</div>
          <button
            className="file-drop-zone__error-close"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
      
      {isProcessing && (
        <div className="file-drop-zone__processing">
          <div className="file-drop-zone__spinner" />
          <div>Processing files...</div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;