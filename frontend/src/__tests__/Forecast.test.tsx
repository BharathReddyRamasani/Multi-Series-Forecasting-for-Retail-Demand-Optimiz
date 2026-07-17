import { render, screen, waitFor } from '@testing-library/react';
import ForecastPage from '../pages/Forecast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock the api client
jest.mock('../api/client', () => ({
  apiClient: {
    storesItems: jest.fn().mockResolvedValue({ stores: [1], items: [1], combinations: 1 }),
    getModelPerformance: jest.fn().mockResolvedValue({
      rmse: 7.2,
      mae: 5,
      r2: 0.95,
      median_ae: 4,
      mbe: 0,
      wape: 12,
      training_time_sec: 2,
      inference_latency_ms: 10,
      cv_mean_rmse: 7.2,
      cv_mean_mae: 5,
      cv_mean_mape: 10,
      cv_mean_smape: 13,
    }),
    forecast: jest.fn().mockResolvedValue({
      store: 1,
      item: 1,
      horizon: 30,
      start_date: '2022-12-31',
      forecasts: [],
      history: [],
      model_version: '1.0.0',
      model_name: 'randomforest',
      expected_sales: 0,
      peak_day: '',
      safety_stock: 0,
      inventory_recommendation: 0,
      demand_trend: '',
      confidence: '',
      spike_expected: false,
      spike_reason: '',
      prediction_risk: '',
    }),
    getModelFeatureImportance: jest.fn().mockResolvedValue([]),
    explain: jest.fn().mockResolvedValue({
      prediction: 0,
      base_value: 0,
      shap_values: [],
      insight_text: ''
    })
  }
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders Forecast page without crashing', async () => {
  renderWithClient(<ForecastPage />);
  // Header should appear immediately
  expect(screen.getByText(/Demand Forecast/i)).toBeInTheDocument();
  // Wait for the Generate Forecast button to be present after queries settle
  await waitFor(() => expect(screen.getByRole('button', { name: /Generate Forecast/i })).toBeInTheDocument());
});
