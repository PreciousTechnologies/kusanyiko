import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import { useAppDispatch } from './hooks/redux';
import { initializeAuth } from './store/slices/authSlice';
import AppRouter from './router/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import { BrandingProvider } from './context/BrandingContext';
import { initializeConsoleOverrides } from './utils/consoleOverrides';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

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
        <div className="App">
          <BrandingProvider>
            <AuthInitializer>
              <AppRouter />
            </AuthInitializer>
          </BrandingProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
