import { useState } from 'react';
import DragDropUpload from '../components/DragDropUpload';
import DocumentList from '../components/DocumentList';
import '../styles/Documents.css';

export default function DocumentsEnhanced() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'simple' | 'dragdrop'>('dragdrop');

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>Documents</h1>
        <p className="subtitle">Upload and manage fleet documents</p>
      </div>

      <div className="content-layout">
        <div className="upload-section">
          <div className="upload-header">
            <h2>Upload Document</h2>
            <div className="upload-mode-toggle">
              <button
                className={`toggle-btn ${uploadMode === 'dragdrop' ? 'active' : ''}`}
                onClick={() => setUploadMode('dragdrop')}
              >
                Drag & Drop
              </button>
              <button
                className={`toggle-btn ${uploadMode === 'simple' ? 'active' : ''}`}
                onClick={() => setUploadMode('simple')}
              >
                Simple
              </button>
            </div>
          </div>
          
          {uploadMode === 'dragdrop' ? (
            <DragDropUpload
              entityType={filterEntityType || undefined}
              onUploadSuccess={handleUploadSuccess}
              multiple={true}
            />
          ) : (
            <p className="info-text">Simple upload mode - feature placeholder</p>
          )}
        </div>

        <div className="list-section">
          <div className="filter-header">
            <h2>All Documents</h2>
            <div className="filters">
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="vehicle">Vehicle</option>
                <option value="service_request">Service Request</option>
                <option value="work_order">Work Order</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>
          </div>
          <DocumentList
            entityType={filterEntityType || undefined}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
