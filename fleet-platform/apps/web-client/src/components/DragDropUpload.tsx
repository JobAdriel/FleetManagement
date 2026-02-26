import { useState, useCallback } from 'react';
import type { DragEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl } from '../services/apiClient';
import '../styles/DragDropUpload.css';

interface DragDropUploadProps {
  entityType?: string;
  entityId?: string;
  onUploadSuccess?: () => void;
  multiple?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function DragDropUpload({ 
  entityType, 
  entityId, 
  onUploadSuccess,
  multiple = false 
}: DragDropUploadProps) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return `File size must be less than 20MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File): Promise<void> => {
    const uploadIndex = uploads.length;
    
    setUploads(prev => [...prev, {
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (entityType) formData.append('entity_type', entityType);
      if (entityId) formData.append('entity_id', entityId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => {
            const updated = [...prev];
            if (updated[uploadIndex]) {
              updated[uploadIndex].progress = percentComplete;
            }
            return updated;
          });
        }
      });

      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads(prev => {
              const updated = [...prev];
              if (updated[uploadIndex]) {
                updated[uploadIndex].status = 'success';
                updated[uploadIndex].progress = 100;
              }
              return updated;
            });
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', buildApiUrl('/documents'));
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploads(prev => {
        const updated = [...prev];
        if (updated[uploadIndex]) {
          updated[uploadIndex].status = 'error';
          updated[uploadIndex].error = errorMessage;
        }
        return updated;
      });
    }
  }, [uploads.length, entityType, entityId, token, onUploadSuccess]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const filesToUpload = multiple ? files : files.slice(0, 1);

    for (const file of filesToUpload) {
      const validationError = validateFile(file);
      if (validationError) {
        setUploads(prev => [...prev, {
          file,
          progress: 0,
          status: 'error',
          error: validationError
        }]);
        continue;
      }

      await uploadFile(file);
    }
  }, [multiple, uploadFile]);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setUploads(prev => [...prev, {
          file,
          progress: 0,
          status: 'error',
          error: validationError
        }]);
        continue;
      }

      await uploadFile(file);
    }

    e.target.value = '';
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status === 'uploading'));
  };

  return (
    <div className="drag-drop-upload">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <div className="upload-icon">📁</div>
          <p className="drop-text">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="or-text">or</p>
          <label htmlFor="file-browse-client" className="browse-button">
            Browse Files
          </label>
          <input
            id="file-browse-client"
            type="file"
            onChange={handleFileInputChange}
            multiple={multiple}
            className="file-input-hidden"
          />
          <p className="file-limit">Maximum file size: 20MB</p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="upload-list">
          <div className="upload-list-header">
            <h3>Uploads ({uploads.length})</h3>
            {uploads.some(u => u.status === 'success' || u.status === 'error') && (
              <button onClick={clearCompleted} className="btn-clear">
                Clear Completed
              </button>
            )}
          </div>
          
          {uploads.map((upload, index) => (
            <div key={index} className={`upload-item ${upload.status}`}>
              <div className="upload-info">
                <span className="file-name">{upload.file.name}</span>
                <span className="file-size">
                  {(upload.file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${upload.progress}%` }}
                  />
                  <span className="progress-text">{upload.progress}%</span>
                </div>
              )}
              
              {upload.status === 'success' && (
                <div className="upload-status success">✓ Uploaded</div>
              )}
              
              {upload.status === 'error' && (
                <div className="upload-status error">
                  ✗ {upload.error || 'Failed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
