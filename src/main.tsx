import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { writeLog } from './services/logService';

writeLog('INFO', 'SYSTEM', 'アプリケーション起動');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
