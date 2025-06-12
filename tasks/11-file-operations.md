# Task 11: File Operations & Data Management

## 🎯 Objective
Implement file import/export operations, auto-save functionality, and data persistence for threat model graphs.

## 📋 Deliverables
1. `src/core/io/FileManager.ts` - Main file operations manager
2. `src/components/io/FileDropZone.tsx` - Drag & drop file interface
3. `src/components/io/ExportDialog.tsx` - Export options dialog
4. `src/core/io/AutoSave.ts` - Auto-save functionality
5. `src/core/io/StorageManager.ts` - Browser storage management
6. `src/hooks/useFileOperations.ts` - File operations hook

## 🔧 Technical Requirements

### File Manager Architecture
```typescript
// FileManager.ts
interface FileOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class FileManager {
  private parser: TM7Parser;
  private exporter: TM7Exporter;
  
  constructor() {
    this.parser = new TM7Parser();
    this.exporter = new TM7Exporter();
  }
  
  async importTM7(file: File): Promise<FileOperationResult<Graph>> {
    try {
      const content = await file.text();
      const graph = this.parser.parse(content);
      
      return {
        success: true,
        data: {
          ...graph,
          metadata: {
            ...graph.metadata,
            name: file.name.replace('.tm7', ''),
            imported: new Date()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import TM7 file: ${error.message}`
      };
    }
  }
  
  async exportTM7(graph: Graph, filename?: string): Promise<FileOperationResult<void>> {
    try {
      const xmlContent = this.exporter.export(graph);
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${graph.metadata.name}.tm7`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export TM7 file: ${error.message}`
      };
    }
  }
  
  async exportJSON(graph: Graph, filename?: string): Promise<FileOperationResult<void>> {
    try {
      const jsonContent = JSON.stringify(graph, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      this.downloadBlob(blob, filename || `${graph.metadata.name}.json`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export JSON file: ${error.message}`
      };
    }
  }
  
  async exportPNG(canvas: HTMLCanvasElement, filename?: string): Promise<FileOperationResult<void>> {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadBlob(blob, filename || 'threat-model.png');
        }
      }, 'image/png');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export PNG: ${error.message}`
      };
    }
  }
  
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

### File Drop Zone Component
```typescript
// FileDropZone.tsx
interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onDrop, 
  accept = '.tm7,.json', 
  multiple = false,
  children 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsProcessing(true);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      accept.split(',').some(type => file.name.endsWith(type.trim()))
    );
    
    if (files.length > 0) {
      onDrop(multiple ? files : [files[0]]);
    }
    
    setIsProcessing(false);
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(multiple ? files : [files[0]]);
    }
  };
  
  return (
    <div 
      className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-input"
      />
      
      {children || (
        <div className="drop-zone-content">
          <div className="drop-zone-icon">📁</div>
          <div className="drop-zone-text">
            Drop TM7 files here or <label htmlFor="file-input">click to browse</label>
          </div>
          <div className="drop-zone-hint">
            Supports .tm7 and .json files
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner" />
          <div>Processing files...</div>
        </div>
      )}
    </div>
  );
};
```

### Export Dialog
```typescript
// ExportDialog.tsx
interface ExportDialogProps {
  graph: Graph;
  canvas: HTMLCanvasElement | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ graph, canvas, isOpen, onClose }) => {
  const [format, setFormat] = useState<'tm7' | 'json' | 'png'>('tm7');
  const [filename, setFilename] = useState(graph.metadata.name);
  const [isExporting, setIsExporting] = useState(false);
  
  const fileManager = useMemo(() => new FileManager(), []);
  
  const handleExport = async () => {
    setIsExporting(true);
    
    let result: FileOperationResult<void>;
    
    switch (format) {
      case 'tm7':
        result = await fileManager.exportTM7(graph, `${filename}.tm7`);
        break;
      case 'json':
        result = await fileManager.exportJSON(graph, `${filename}.json`);
        break;
      case 'png':
        if (canvas) {
          result = await fileManager.exportPNG(canvas, `${filename}.png`);
        } else {
          result = { success: false, error: 'Canvas not available' };
        }
        break;
    }
    
    if (!result.success) {
      // Show error notification
      console.error(result.error);
    }
    
    setIsExporting(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <div className="dialog-header">
          <h3>Export Threat Model</h3>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          <div className="form-group">
            <label>Format</label>
            <Select
              value={format}
              onChange={setFormat}
              options={[
                { value: 'tm7', label: 'TM7 (Microsoft Threat Modeling Tool)' },
                { value: 'json', label: 'JSON (TM8 Native Format)' },
                { value: 'png', label: 'PNG Image' }
              ]}
            />
          </div>
          
          <div className="form-group">
            <label>Filename</label>
            <Input
              value={filename}
              onChange={setFilename}
              placeholder="Enter filename"
            />
          </div>
          
          {format === 'png' && (
            <div className="export-options">
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked />
                  Include background
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked />
                  High resolution (2x)
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Auto-Save System
```typescript
// AutoSave.ts
class AutoSave {
  private storageManager: StorageManager;
  private saveInterval: number = 30000; // 30 seconds
  private intervalId: number | null = null;
  private lastSaveTime: Date | null = null;
  
  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }
  
  start(graph: Graph, key: string = 'current-threat-model'): void {
    this.stop(); // Stop any existing auto-save
    
    this.intervalId = window.setInterval(() => {
      this.saveGraph(graph, key);
    }, this.saveInterval);
    
    // Also save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveGraph(graph, key);
    });
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private saveGraph(graph: Graph, key: string): void {
    try {
      const graphWithTimestamp = {
        ...graph,
        metadata: {
          ...graph.metadata,
          lastAutoSave: new Date()
        }
      };
      
      this.storageManager.save(key, graphWithTimestamp);
      this.lastSaveTime = new Date();
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }
  
  getLastSaveTime(): Date | null {
    return this.lastSaveTime;
  }
}
```

### Storage Manager
```typescript
// StorageManager.ts
class StorageManager {
  private prefix: string = 'tm8-';
  
  save(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        throw new Error('Storage quota exceeded. Some old data has been cleared.');
      }
      throw error;
    }
  }
  
  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
      return null;
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  list(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }
  
  private cleanup(): void {
    // Remove old auto-save files
    const keys = this.list();
    const autoSaveKeys = keys.filter(key => key.startsWith('auto-save-'));
    autoSaveKeys.forEach(key => this.remove(key));
  }
}
```

## ✅ Acceptance Criteria
- [x] TM7 files can be imported via drag & drop or file picker
- [x] Graphs can be exported to TM7, JSON, and PNG formats
- [x] Auto-save works every 30 seconds
- [x] File operations provide proper error handling
- [x] Large files (big.tm7) import without blocking UI
- [x] Export dialog shows all format options
- [x] Browser storage persists between sessions
- [x] Storage quota management prevents crashes

## 🔗 Dependencies
- Task 04: TM7 Parser (for import/export)
- Task 06: UI Components (Button, Input, Select)
- Task 05: Graph Data Structures (Graph interface)

## ⚡ Performance Notes
- Use Web Workers for large file parsing
- Implement streaming for very large files
- Compress stored data when possible
- Clean up old auto-save files automatically