import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import styles from './ReceiveDataPage.module.css';

/**
 * データ受信画面
 */
export function ReceiveDataPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'receiving' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleReceive = useCallback(function() {
    setStatus('connecting');
    setMessage('サーバーに接続中...');
    setProgress(0);

    // シミュレーション: 接続
    setTimeout(function() {
      setStatus('receiving');
      setMessage('データ受信中...');
      setProgress(30);

      // シミュレーション: 受信
      setTimeout(function() {
        setProgress(70);
        setTimeout(function() {
          setProgress(100);
          setStatus('success');
          setMessage('受信完了: 150件のデータ');
        }, 500);
      }, 800);
    }, 1000);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      if (status !== 'connecting' && status !== 'receiving') {
        navigate('/');
      }
    } else if (e.key === 'Enter') {
      if (status === 'idle' || status === 'success' || status === 'error') {
        handleReceive();
      }
    }
  }

  return (
    <AppLayout title="データ受信">
      <div className={styles.container} onKeyDown={handleKeyDown} tabIndex={0}>
        <div className={styles.content}>
          <div className={styles.iconArea}>
            {status === 'idle' && <span className={styles.icon}>📥</span>}
            {status === 'connecting' && <span className={styles.iconSpin}>🔄</span>}
            {status === 'receiving' && <span className={styles.iconSpin}>📡</span>}
            {status === 'success' && <span className={styles.iconSuccess}>✅</span>}
            {status === 'error' && <span className={styles.iconError}>❌</span>}
          </div>

          <div className={styles.message}>{message || 'サーバーからデータを受信します'}</div>

          {(status === 'connecting' || status === 'receiving') && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: progress + '%' }}></div>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.resultBox}>
              <div className={styles.resultItem}>
                <span>マスタデータ</span>
                <span>150件</span>
              </div>
              <div className={styles.resultItem}>
                <span>更新日時</span>
                <span>{new Date().toLocaleString('ja-JP')}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {(status === 'idle' || status === 'success' || status === 'error') && (
            <button className={styles.buttonPrimary} onClick={handleReceive}>
              {status === 'success' ? '再受信' : '受信開始'}
            </button>
          )}
          {(status === 'connecting' || status === 'receiving') && (
            <button className={styles.buttonDisabled} disabled>
              受信中...
            </button>
          )}
        </div>

        <div className={styles.hint}>
          Enter: 受信開始
        </div>
      </div>
    </AppLayout>
  );
}
