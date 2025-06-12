/**
 * Export Dialog component for choosing export format and options
 * Supports TM7, JSON, PNG, and SVG export formats
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { Graph } from '../../core/types/graph';
import { FileManager, type FileOperationResult } from '../../core/io/FileManager';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export type ExportFormat = 'tm7' | 'json' | 'png' | 'svg';

export interface ExportDialogProps {
  graph: Graph;
  canvas: HTMLCanvasElement | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (format: ExportFormat, filename: string) => void;
  onError?: (error: string) => void;
}

interface ExportOptions {
  includeBackground: boolean;
  highResolution: boolean;
  prettifyJson: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ 
  graph, 
  canvas, 
  isOpen, 
  onClose,
  onSuccess,
  onError 
}) => {
  const [format, setFormat] = useState<ExportFormat>('tm7');
  const [filename, setFilename] = useState(graph.metadata.name || 'threat-model');
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeBackground: true,
    highResolution: false,
    prettifyJson: true
  });

  const fileManager = useMemo(() => new FileManager(), []);

  const formatOptions = [
    { value: 'tm7', label: 'TM7 (Microsoft Threat Modeling Tool)', extension: '.tm7' },
    { value: 'json', label: 'JSON (TM8 Native Format)', extension: '.json' },
    { value: 'png', label: 'PNG Image', extension: '.png' },
    { value: 'svg', label: 'SVG Vector Image', extension: '.svg' }
  ];

  const currentFormatInfo = formatOptions.find(opt => opt.value === format);

  const getFullFilename = useCallback(() => {
    const ext = currentFormatInfo?.extension || '';
    return filename.endsWith(ext) ? filename : filename + ext;
  }, [filename, currentFormatInfo]);

  const updateOption = useCallback((key: keyof ExportOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!filename.trim()) {
      onError?.('Filename is required');
      return;
    }

    setIsExporting(true);

    try {
      let result: FileOperationResult<void>;
      const fullFilename = getFullFilename();

      switch (format) {
        case 'tm7':
          result = await fileManager.exportTM7(graph, fullFilename);
          break;
        
        case 'json':
          result = await fileManager.exportJSON(graph, fullFilename);
          break;
        
        case 'png':
          if (!canvas) {
            result = { success: false, error: 'Canvas not available for PNG export' };
          } else {
            result = await fileManager.exportPNG(canvas, fullFilename, {
              includeBackground: options.includeBackground,
              highResolution: options.highResolution
            });
          }
          break;
        
        case 'svg':
          result = await fileManager.exportSVG(graph, fullFilename);
          break;
        
        default:
          result = { success: false, error: `Unsupported format: ${format}` };
      }

      if (result.success) {
        onSuccess?.(format, fullFilename);
        onClose();
      } else {
        onError?.(result.error || 'Export failed');
      }
    } catch (error) {
      onError?.(error.message || 'Unexpected error during export');
    } finally {
      setIsExporting(false);
    }
  }, [format, filename, graph, canvas, options, fileManager, getFullFilename, onSuccess, onError, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleExport();
    }
  }, [onClose, handleExport]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setFilename(graph.metadata.name || 'threat-model');
      setIsExporting(false);
    }
  }, [isOpen, graph.metadata.name]);

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div 
        className="export-dialog" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="export-dialog-title"
        aria-modal="true"
      >
        <div className="export-dialog__header">
          <h3 id="export-dialog-title">Export Threat Model</h3>
          <button
            className="export-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isExporting}
          >
            ×
          </button>
        </div>
        
        <div className="export-dialog__content">
          <div className="export-dialog__section">
            <div className="form-group">
              <label htmlFor="export-format">Export Format</label>
              <Select
                id="export-format"
                value={format}
                onChange={setFormat}
                options={formatOptions}
                disabled={isExporting}
              />
              <div className="form-hint">
                Choose the format for your exported threat model
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="export-filename">Filename</label>
              <div className="filename-input-group">
                <Input
                  id="export-filename"
                  value={filename}
                  onChange={setFilename}
                  placeholder="Enter filename"
                  disabled={isExporting}
                />
                <span className="filename-extension">
                  {currentFormatInfo?.extension}
                </span>
              </div>
              <div className="form-hint">
                Name for the exported file (extension will be added automatically)
              </div>
            </div>
          </div>

          {/* Format-specific options */}
          {format === 'png' && (
            <div className="export-dialog__section">
              <h4>PNG Options</h4>
              <div className="export-options">
                <label className="checkbox-option">
                  <input 
                    type="checkbox" 
                    checked={options.includeBackground}
                    onChange={(e) => updateOption('includeBackground', e.target.checked)}
                    disabled={isExporting}
                  />
                  Include background
                  <span className="checkbox-hint">Add white background to the exported image</span>
                </label>
                
                <label className="checkbox-option">
                  <input 
                    type="checkbox" 
                    checked={options.highResolution}
                    onChange={(e) => updateOption('highResolution', e.target.checked)}
                    disabled={isExporting}
                  />
                  High resolution (2x)
                  <span className="checkbox-hint">Export at double resolution for better quality</span>
                </label>
              </div>
              
              {!canvas && (
                <div className="export-warning">
                  ⚠️ Canvas not available. PNG export may not work properly.
                </div>
              )}
            </div>
          )}

          {format === 'json' && (
            <div className="export-dialog__section">
              <h4>JSON Options</h4>
              <div className="export-options">
                <label className="checkbox-option">
                  <input 
                    type="checkbox" 
                    checked={options.prettifyJson}
                    onChange={(e) => updateOption('prettifyJson', e.target.checked)}
                    disabled={isExporting}
                  />
                  Pretty print JSON
                  <span className="checkbox-hint">Format JSON with indentation for readability</span>
                </label>
              </div>
            </div>
          )}

          {format === 'tm7' && (
            <div className="export-dialog__section">
              <div className="export-info">
                <h4>TM7 Export</h4>
                <p>
                  Export as Microsoft Threat Modeling Tool format. 
                  This format is compatible with the official Microsoft tool 
                  and other TM7-compatible applications.
                </p>
              </div>
            </div>
          )}

          {format === 'svg' && (
            <div className="export-dialog__section">
              <div className="export-info">
                <h4>SVG Export</h4>
                <p>
                  Export as scalable vector graphics. Perfect for documentation 
                  and presentations as it maintains quality at any size.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="export-dialog__actions">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
          >
            {isExporting ? (
              <>
                <span className="export-spinner" />
                Exporting...
              </>
            ) : (
              `Export ${format.toUpperCase()}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;