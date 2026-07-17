import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Analytics from '../pages/Analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock the API client used by Analytics
jest.mock('../api/client', () => ({
  apiClient: {
    storesItems: jest.fn().mockResolvedValue({ stores: [1], items: [1], combinations: 1 }),
    featureImportance: jest.fn().mockResolvedValue([]),
    storeSales: jest.fn().mockResolvedValue({ monthly: [], weekly: [] }),
    itemSales: jest.fn().mockResolvedValue({ monthly: [], weekly: [] }),
    getPredictionHistory: jest.fn().mockResolvedValue({
      rows: [
        { date: '2023-01-01', actual: 100, predicted: 110, error: 10, error_pct: 10 },
        { date: '2023-01-02', actual: 120, predicted: 115, error: -5, error_pct: -4.1667 },
      ],
      mae: 7.5,
      mape: 7.5,
      sigma: 2,
    }),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders error analysis chart with real prediction data', async () => {
  renderWithClient(<Analytics />);

  // Switch to the Error Analysis tab
  const errorTabButton = screen.getByRole('button', { name: /Error Analysis/i });
  fireEvent.click(errorTabButton);

  // Wait for the chart canvas to appear (indicates data loaded)
  await waitFor(() => expect(document.querySelector('.chart-wrap-tall canvas')).not.toBeNull());

  // Verify error percentage badge is rendered
  expect(screen.getByText(/Error %:/i)).toBeInTheDocument();
});
