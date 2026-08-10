import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { LanguageProvider } from './context/LanguageContext';
import ToastContainer from './components/ui/ToastContainer';
import AppRouter from './router';
import './i18n';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
