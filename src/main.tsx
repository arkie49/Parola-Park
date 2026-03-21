import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  const saved = localStorage.getItem('parola_settings');
  if (saved) {
    const settings = JSON.parse(saved);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }
} catch (e) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
