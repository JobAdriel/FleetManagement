import { useState } from 'react';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';
import '../styles/Documents.css';

export default function Documents() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterEntityType, setFilterEntityType] = useState<string>('');

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
          <h2>Upload Document</h2>
          <DocumentUpload
            entityType={filterEntityType || undefined}
            onUploadSuccess={handleUploadSuccess}
          />
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
