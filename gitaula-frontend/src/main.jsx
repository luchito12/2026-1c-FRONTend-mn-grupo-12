import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './app/router/App.jsx';
import { queryClient } from './app/queryClient.js';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppThemeProvider } from './theme/AppThemeProvider.jsx';
import { FeedbackProvider } from './shared/ui/FeedbackProvider';
import { ErrorBoundary } from './shared/ui/ErrorBoundary.jsx';
import { UnsavedChangesProvider } from './shared/ui/UnsavedChanges.jsx';
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <UnsavedChangesProvider>
          <App />
        </UnsavedChangesProvider>
      </AuthProvider>
    ),
  },
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FeedbackProvider>
            <RouterProvider router={router} />
          </FeedbackProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </AppThemeProvider>
  </StrictMode>,
);
