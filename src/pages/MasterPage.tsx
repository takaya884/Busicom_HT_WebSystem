import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import styles from './MasterPage.module.css';

/**
 * チェックマスタ作成画面
 */
export function MasterPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [items, setItems] = useState<Array<{ code: string; name: string }>>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(function() {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannedCode.trim();
      if (code) {
        const exists = items.some(function(item) { return item.code === code; });
        if (exists) {
          setToast({ message: '登録済み: ' + code, type: 'info' });
        } else {
          setItems(items.concat([{ code: code, name: '' }]));
          setToast({ message: 'マスタ追加: ' + code, type: 'success' });
        }
        setScannedCode('');
      }
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      if (!scannedCode) {
        navigate('/');
      }
    }
  }

  function handleDelete(index: number) {
    const newItems = items.slice();
    newItems.splice(index, 1);
    setItems(newItems);
    setToast({ message: '削除しました', type: 'info' });
  }

  return (
    <AppLayout title="マスタ作成">
      <div className={styles.container}>
        <div className={styles.inputSection}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="バーコードをスキャン"
            value={scannedCode}
            onChange={function(e) { setScannedCode(e.target.value); }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.stats}>
          <span>マスタ件数: {items.length}</span>
        </div>

        <div className={styles.list}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📝</span>
              <span>マスタデータなし</span>
            </div>
          ) : (
            items.map(function(item, index) {
              return (
                <div key={index} className={styles.listItem}>
                  <span className={styles.itemCode}>{item.code}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={function() { handleDelete(index); }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.buttonClear} onClick={function() { setItems([]); }}>
            クリア
          </button>
          <button className={styles.buttonPrimary} onClick={function() { setToast({ message: 'マスタ保存完了', type: 'success' }); }}>
            保存
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={function() { setToast(null); }}
          duration={2000}
        />
      )}
    </AppLayout>
  );
}
