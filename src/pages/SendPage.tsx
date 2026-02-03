import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { getScannedData, getScannedDataCount, clearScannedData } from '../services/storageService';
import { checkNetwork, sendData } from '../services/networkService';
import { writeLog } from '../services/logService';
import styles from './SendPage.module.css';

export function SendPage() {
  const [count, setCount] = useState(getScannedDataCount);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSend = async () => {
    if (count === 0) {
      setToast({ message: '送信するデータがありません', type: 'info' });
      return;
    }

    setSending(true);
    writeLog('INFO', 'OPERATION', 'サーバー送信開始');

    // ネットワーク確認
    const isOnline = await checkNetwork();
    if (!isOnline) {
      setToast({
        message: 'ネットワークに接続できません。WiFiまたはモバイル通信を確認してください。',
        type: 'error',
      });
      writeLog('ERROR', 'OPERATION', 'サーバー送信失敗: ネットワーク未接続');
      setSending(false);
      return;
    }

    // データ送信
    const data = getScannedData();
    const result = await sendData(data);

    if (result.success) {
      clearScannedData();
      setCount(0);
      setToast({ message: result.message, type: 'success' });
      writeLog('INFO', 'OPERATION', `サーバー送信成功: ${result.sentCount}件`);
    } else {
      setToast({ message: result.message, type: 'error' });
      writeLog('ERROR', 'OPERATION', `サーバー送信失敗: ${result.message}`);
    }

    setSending(false);
  };

  return (
    <AppLayout title="サーバー送信">
      <div className={styles.container}>
        <div className={styles.info}>
          <StatusBadge count={count} label="件 送信待ち" />
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || count === 0}
        >
          {sending ? '送信中...' : 'サーバーに送信'}
        </button>

        {count === 0 && (
          <p className={styles.empty}>送信するデータがありません</p>
        )}

        <p className={styles.note}>
          送信前にネットワーク接続を自動確認します。
          送信成功後、蓄積データはクリアされます。
        </p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </AppLayout>
  );
}
