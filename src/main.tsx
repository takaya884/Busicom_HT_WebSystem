import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { writeLog } from './services/logService';
import { initDatabase } from './services/sqliteService';

// SQLiteデータベース初期化後にReactアプリを起動
initDatabase()
  .then(function () {
    writeLog('INFO', 'SYSTEM', 'アプリケーション起動');

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch(function (error) {
    // eslint-disable-next-line no-console
    console.error('Database initialization failed:', error);
    // DBエラーでも最低限の表示は行う
    document.getElementById('root')!.innerHTML =
      '<div style="padding:20px;color:red;">データベースの初期化に失敗しました</div>';
  });
