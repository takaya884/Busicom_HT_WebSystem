import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import styles from './ReceivingPage.module.css';

/**
 * 入庫画面
 */
export function ReceivingPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [items, setItems] = useState<Array<{ code: string; quantity: number }>>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(function() {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannedCode.trim();
      if (code) {
        const existingIndex = items.findIndex(function(item) { return item.code === code; });
        if (existingIndex >= 0) {
          const newItems = items.slice();
          newItems[existingIndex].quantity += 1;
          setItems(newItems);
        } else {
          setItems(items.concat([{ code: code, quantity: 1 }]));
        }
        setToast({ message: '入庫: ' + code, type: 'success' });
        setScannedCode('');
      }
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      if (!scannedCode) {
        navigate('/');
      }
    }
  }

  const totalQuantity = items.reduce(function(sum, item) { return sum + item.quantity; }, 0);

  return (
    <AppLayout title="入庫">
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
          <span>品目: {items.length}</span>
          <span>総数: {totalQuantity}</span>
        </div>

        <div className={styles.list}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📥</span>
              <span>入庫データなし</span>
            </div>
          ) : (
            items.map(function(item, index) {
              return (
                <div key={index} className={styles.listItem}>
                  <span className={styles.itemCode}>{item.code}</span>
                  <span className={styles.itemQty}>×{item.quantity}</span>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.buttonClear} onClick={function() { setItems([]); }}>
            クリア
          </button>
          <button className={styles.buttonPrimary} onClick={function() { setToast({ message: '入庫完了', type: 'success' }); }}>
            完了
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
