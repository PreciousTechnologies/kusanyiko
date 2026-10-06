import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from './components/ui/sonner';
import { store } from './store';
import { useAppDispatch } from './hooks/redux';
import { initializeAuth } from './store/slices/authSlice';
import AppRouter from './router/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import { DialogProvider } from './components/ui/Dialog';
import { BrandingProvider } from './context/BrandingContext';
import { ThemeProvider } from './context/ThemeContext';
import { initializeConsoleOverrides } from './utils/consoleOverrides';
import './App.css';
import './styles/efatha-theme.css';
import './styles/efatha-forms.css';

// Initialize console overrides to suppress development noise
initializeConsoleOverrides();

// Component to handle auth initialization
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <DialogProvider>
        <div className="App">
          <ThemeProvider>
          <BrandingProvider>
            <AuthInitializer>
              <AppRouter />
            </AuthInitializer>
            <Toaster />
          </BrandingProvider>
          </ThemeProvider>
        </div>
        </DialogProvider>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
