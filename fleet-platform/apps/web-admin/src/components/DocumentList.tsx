import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import '../styles/DocumentList.css';

interface Document {
  id: string;
  original_filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
}

interface DocumentListProps {
  entityType?: string;
  entityId?: string;
  refreshTrigger?: number;
}

export default function DocumentList({ entityType, entityId, refreshTrigger }: DocumentListProps) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let endpoint = '/documents';
      const params = new URLSearchParams();
      if (entityType) params.append('entity_type', entityType);
      if (entityId) params.append('entity_id', entityId);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await apiClient.get(endpoint, token);
      if (response.error) {
        throw new Error(response.error);
      }
      const data = response.data as { data?: Document[] } | Document[];
      setDocuments(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [token, entityType, entityId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  const handleDownload = async (documentId: string, filename: string) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!token || !confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await apiClient.delete(`/documents/${documentId}`, token);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <div className="loading">Loading documents...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="document-list">
      {documents.length === 0 ? (
        <div className="empty-state">No documents uploaded yet</div>
      ) : (
        <table className="documents-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.original_filename}</td>
                <td>{doc.mime_type}</td>
                <td>{(doc.size / 1024).toFixed(2)} KB</td>
                <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  <button
                    onClick={() => handleDownload(doc.id, doc.original_filename)}
                    className="btn-small btn-primary"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="btn-small btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
