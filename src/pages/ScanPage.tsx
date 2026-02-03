import { useState, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { useScanner } from '../hooks/useScanner';
import { getScannedDataCount } from '../services/storageService';
import { writeLog } from '../services/logService';
import styles from './ScanPage.module.css';

export function ScanPage() {
  const [lastScanned, setLastScanned] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [count, setCount] = useState(getScannedDataCount);

  const handleScan = useCallback((value: string) => {
    setLastScanned(value);
    setCount(getScannedDataCount());
    setToast({ message: `読取完了: ${value}`, type: 'success' });
    writeLog('INFO', 'OPERATION', `スキャン画面: 読取成功 [${value}]`);
  }, []);

  const { inputRef, handleKeyDown } = useScanner({ onScan: handleScan });

  return (
    <AppLayout title="データ読取">
      <div className={styles.container}>
        <div className={styles.statusRow}>
          <StatusBadge count={count} label="件 蓄積済" />
        </div>

        <label className={styles.label}>バーコード読取</label>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="スキャンまたは入力..."
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <p className={styles.hint}>
          HTでバーコードを読み取るか、値を入力してEnterキーを押してください
        </p>

        {lastScanned && (
          <div className={styles.lastScanned}>
            <span className={styles.lastLabel}>最終読取:</span>
            <span className={styles.lastValue}>{lastScanned}</span>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppLayout>
  );
}
