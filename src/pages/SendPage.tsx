import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { getScannedData, getScannedDataCount, clearScannedData } from '../services/storageService';
import { checkNetwork, sendData, getApiUrl } from '../services/networkService';
import { writeLog } from '../services/logService';
import styles from './SendPage.module.css';

type FocusArea = 'send' | 'cancel';

export function SendPage() {
  var navigate = useNavigate();
  var [count, setCount] = useState(getScannedDataCount);
  var [sending, setSending] = useState(false);
  var [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  var [focusArea, setFocusArea] = useState<FocusArea>('send');
  var [apiUrl] = useState(getApiUrl);

  var handleSend = useCallback(async function () {
    if (count === 0) {
      setToast({ message: '送信するデータがありません', type: 'info' });
      return;
    }

    setSending(true);
    writeLog('INFO', 'OPERATION', 'サーバー送信開始');

    // ネットワーク確認
    var isOnline = await checkNetwork();
    if (!isOnline) {
      setToast({
        message: 'ネットワークに接続できません',
        type: 'error',
      });
      writeLog('ERROR', 'OPERATION', 'サーバー送信失敗: ネットワーク未接続');
      setSending(false);
      return;
    }

    // データ送信
    var data = getScannedData();
    var result = await sendData(data);

    if (result.success) {
      clearScannedData();
      setCount(0);
      setToast({ message: result.message, type: 'success' });
      writeLog('INFO', 'OPERATION', 'サーバー送信成功: ' + result.sentCount + '件');
    } else {
      setToast({ message: result.message, type: 'error' });
      writeLog('ERROR', 'OPERATION', 'サーバー送信失敗: ' + result.message);
    }

    setSending(false);
  }, [count]);

  // キーボードナビゲーション
  var handleKeyDown = useCallback(function (e: KeyboardEvent) {
    if (sending) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        setFocusArea(function (prev) { return prev === 'send' ? 'cancel' : 'send'; });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusArea === 'send' && count > 0) {
          handleSend();
        } else if (focusArea === 'cancel') {
          navigate('/');
        }
        break;
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        navigate('/');
        break;
      default:
        break;
    }
  }, [focusArea, sending, count, handleSend, navigate]);

  useEffect(function () {
    window.addEventListener('keydown', handleKeyDown);
    return function () {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <AppLayout title="データ送信">
      <div className={styles.container}>
        {/* ステータス表示 */}
        <div className={styles.statusSection}>
          <StatusBadge count={count} label="件 送信待ち" />
        </div>

        {/* 接続先情報 */}
        <div className={styles.serverInfo}>
          <span className={styles.serverLabel}>送信先:</span>
          <span className={styles.serverUrl}>{apiUrl}</span>
        </div>

        {/* 送信ボタン */}
        <button
          className={focusArea === 'send' ? styles.sendButtonFocused : styles.sendButton}
          onClick={handleSend}
          disabled={sending || count === 0}
        >
          {sending ? '送信中...' : 'サーバーに送信'}
        </button>

        {/* キャンセルボタン */}
        <button
          className={focusArea === 'cancel' ? styles.cancelButtonFocused : styles.cancelButton}
          onClick={function () { navigate('/'); }}
          disabled={sending}
        >
          キャンセル
        </button>

        {count === 0 && (
          <p className={styles.empty}>送信するデータがありません</p>
        )}

        {/* 説明 */}
        <p className={styles.note}>
          送信成功後、蓄積データはクリアされます
        </p>

        {/* 操作ヒント */}
        <div className={styles.hint}>
          ↑↓:選択 Enter:実行 ESC:戻る
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={function () { setToast(null); }}
          duration={4000}
        />
      )}
    </AppLayout>
  );
}
