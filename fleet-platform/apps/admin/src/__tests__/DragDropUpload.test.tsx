import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DragDropUpload from '@/components/DragDropUpload';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// TODO: Update tests to match actual component props (uses onUploadSuccess not onUploadComplete, no apiUrl prop)
// TODO: Mock AuthContext provider for useAuth hook
describe.skip('DragDropUpload', () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    mockOnUploadComplete.mockClear();
    global.fetch = vi.fn();
  });

  it('renders the upload zone', () => {
    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('shows drag state when dragging over', () => {
    const { container } = render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const dropZone = container.querySelector('.drag-drop-upload');
    
    fireEvent.dragEnter(dropZone!);
    expect(dropZone).toHaveClass('dragging');

    fireEvent.dragLeave(dropZone!);
    expect(dropZone).not.toHaveClass('dragging');
  });

  it('accepts file selection via file input', async () => {
    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('validates file size limit', async () => {
    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
    });
  });

  it('validates allowed file types', async () => {
    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
    });
  });

  it('displays upload progress', async () => {
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {
        addEventListener: vi.fn(),
      },
      addEventListener: vi.fn(),
    };

    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockXHR.upload.addEventListener).toHaveBeenCalledWith(
        'progress',
        expect.any(Function)
      );
    });
  });

  it('handles multiple file uploads', async () => {
    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
        multiple={true}
      />
    );

    const files = [
      new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['test2'], 'test2.pdf', { type: 'application/pdf' }),
    ];

    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });

  it('can cancel upload', async () => {
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      abort: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {
        addEventListener: vi.fn(),
      },
      addEventListener: vi.fn(),
    };

    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);
    });

    expect(mockXHR.abort).toHaveBeenCalled();
  });

  it('calls onUploadComplete on successful upload', async () => {
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      status: 200,
      responseText: JSON.stringify({ data: { id: 'doc-123' } }),
      upload: {
        addEventListener: vi.fn(),
      },
      addEventListener: vi.fn((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(() => callback(), 0);
        }
      }),
    };

    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    render(
      <DragDropUpload
        entityType="vehicle"
        entityId="test-id"
        onUploadSuccess={mockOnUploadComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
  });
});
