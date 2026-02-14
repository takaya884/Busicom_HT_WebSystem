import { useState } from 'react';
import { login } from '../services/authService';
import styles from './LoginPage.module.css';

interface LoginPageProps {
  onLoginSuccess: (userId: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  var userIdState = useState('');
  var userId = userIdState[0];
  var setUserId = userIdState[1];

  var passwordState = useState('');
  var password = passwordState[0];
  var setPassword = passwordState[1];

  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  var loadingState = useState(false);
  var isLoading = loadingState[0];
  var setIsLoading = loadingState[1];

  var statusState = useState('');
  var status = statusState[0];
  var setStatus = statusState[1];

  async function handleLogin() {
    setError('');
    setStatus('認証中...');
    setIsLoading(true);

    var result = await login(userId, password);

    setIsLoading(false);
    setStatus('');

    if (result.success) {
      onLoginSuccess(result.userId || userId);
    } else {
      setError(result.message);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ログイン</h1>

        <div className={styles.field}>
          <label className={styles.label}>ユーザーID</label>
          <input
            className={styles.input}
            type="text"
            value={userId}
            onChange={function (e) { setUserId(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="IDを入力"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={function (e) { setPassword(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="パスワードを入力"
            disabled={isLoading}
          />
        </div>

        <button
          className={styles.loginButton}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? '認証中...' : 'ログイン'}
        </button>

        {error && <div className={styles.error}>{error}</div>}
        {status && <div className={styles.status}>{status}</div>}
      </div>
    </div>
  );
}
