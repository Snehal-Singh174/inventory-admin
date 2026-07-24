import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Routes from './Routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,       // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
        AuthProvider is inside BrowserRouter (mounted in Routes.tsx) — but since
        it only uses localStorage/API calls (no useNavigate), it's safe here.
        Components that need navigation call useNavigate themselves.
      */}
      <AuthProvider>
        <Routes />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Manrope, sans-serif' },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
