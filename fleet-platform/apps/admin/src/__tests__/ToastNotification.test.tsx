import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '@/components/ToastNotification';
import { describe, it, expect, vi, afterEach } from 'vitest';

const TestComponent = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast({ type: 'success', title: 'Success', message: 'Success message' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ type: 'error', title: 'Error', message: 'Error message' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ type: 'warning', title: 'Warning', message: 'Warning message' })}>
        Show Warning
      </button>
      <button onClick={() => showToast({ type: 'info', title: 'Info', message: 'Info message' })}>
        Show Info
      </button>
    </div>
  );
};

describe('ToastNotification', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast provider without errors', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays success toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Success message').closest('.toast');
    expect(toast).toHaveClass('toast-success');
  });

  it('displays error toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Error message').closest('.toast');
    expect(toast).toHaveClass('toast-error');
  });

  it('displays warning toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Warning');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Warning message').closest('.toast');
    expect(toast).toHaveClass('toast-warning');
  });

  it('displays info toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Info message').closest('.toast');
    expect(toast).toHaveClass('toast-info');
  });

  it('auto-dismisses toast after duration', async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    fireEvent.click(button);

    expect(screen.getByText('Success message')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();

  });

  it('displays multiple toasts simultaneously', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('can manually close toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('throws error when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');

    consoleError.mockRestore();
  });

  it.skip('limits number of toasts displayed', async () => {
    // TODO: ToastProvider doesn't currently support maxToasts prop
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();
    screen.getByText('Show Error').click();
    screen.getByText('Show Warning').click();
    screen.getByText('Show Info').click();

    await waitFor(() => {
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBeLessThanOrEqual(3);
    });
  });
});
