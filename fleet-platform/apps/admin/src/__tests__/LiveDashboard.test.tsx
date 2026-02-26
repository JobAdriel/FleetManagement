import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import LiveDashboard from '@/pages/LiveDashboard';
import { apiClient } from '@/services/apiClient';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('LiveDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        total_vehicles: 50,
        by_status: {
          active: 30,
          maintenance: 15,
          inactive: 5,
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders dashboard title', async () => {
    render(<LiveDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/live fleet dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<LiveDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches and displays fleet statistics', async () => {
    render(<LiveDashboard />);

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays stat cards with correct labels', async () => {
    render(<LiveDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/total fleet/i)).toBeInTheDocument();
      expect(screen.getByText(/active vehicles/i)).toBeInTheDocument();
      expect(screen.getByText(/in maintenance/i)).toBeInTheDocument();
      expect(screen.getByText(/inactive/i)).toBeInTheDocument();
    });
  });

  it('calls API using correct endpoint and token', async () => {
    render(<LiveDashboard />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/reports/fleet-summary', 'test-token');
    });
  });

  it('shows live indicator', async () => {
    render(<LiveDashboard />);

    await waitFor(() => {
      const liveIndicator = screen.getByText(/live updates/i);
      expect(liveIndicator).toBeInTheDocument();
    });
  });

  it('polls for updates at regular intervals', async () => {
    vi.useFakeTimers();

    render(<LiveDashboard />);

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30000);

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ error: 'Network error' });

    render(<LiveDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/live fleet dashboard/i)).toBeInTheDocument();
    });
  });
});
