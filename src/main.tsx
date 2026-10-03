import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SecurityProvider } from './context/SecurityContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SecurityProvider>
        <App />
      </SecurityProvider>
    </ThemeProvider>
  </StrictMode>,
);
