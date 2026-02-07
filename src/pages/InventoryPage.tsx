import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { writeLog } from '../services/logService';
import { generateId } from '../utils/dateUtils';
import styles from './InventoryPage.module.css';

interface InventoryItem {
  id: string;
  code: string;
  quantity: number;
  scannedAt: string;
}

type ScanMode = 'location' | 'item';
type FocusArea = 'input' | 'list' | 'actions';

export function InventoryPage() {
  var navigate = useNavigate();
  var [location, setLocation] = useState('');
  var [items, setItems] = useState<InventoryItem[]>([]);
  var [scanMode, setScanMode] = useState<ScanMode>('location');
  var [inputValue, setInputValue] = useState('');
  var [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  var [focusArea, setFocusArea] = useState<FocusArea>('input');
  var [selectedItemIndex, setSelectedItemIndex] = useState(0);
  var [selectedActionIndex, setSelectedActionIndex] = useState(0);
  var inputRef = useRef<HTMLInputElement>(null);
  var listRef = useRef<HTMLUListElement>(null);

  // 入力欄に自動フォーカス
  useEffect(function () {
    if (focusArea === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusArea, scanMode]);

  // 選択アイテムをスクロールで表示
  useEffect(function () {
    if (focusArea === 'list' && listRef.current && items.length > 0) {
      var selectedElement = listRef.current.children[selectedItemIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedItemIndex, focusArea, items.length]);

  // グローバルキーハンドラ
  var handleGlobalKeyDown = useCallback(function (e: KeyboardEvent) {
    // 入力フォーカス中は特別処理
    if (focusArea === 'input') {
      if (e.key === 'ArrowDown' && items.length > 0) {
        e.preventDefault();
        setFocusArea('list');
        setSelectedItemIndex(0);
      } else if (e.key === 'Escape' || (e.key === 'Backspace' && !inputValue)) {
        e.preventDefault();
        navigate('/');
      }
      return;
    }

    // リストフォーカス中
    if (focusArea === 'list') {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (selectedItemIndex > 0) {
            setSelectedItemIndex(selectedItemIndex - 1);
          } else {
            setFocusArea('input');
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (selectedItemIndex < items.length - 1) {
            setSelectedItemIndex(selectedItemIndex + 1);
          } else {
            setFocusArea('actions');
            setSelectedActionIndex(0);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (items.length > 0) {
            handleDeleteItem(selectedItemIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusArea('input');
          break;
        default:
          break;
      }
      return;
    }

    // アクションフォーカス中
    if (focusArea === 'actions') {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (items.length > 0) {
            setFocusArea('list');
            setSelectedItemIndex(items.length - 1);
          } else {
            setFocusArea('input');
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedActionIndex(0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedActionIndex(1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedActionIndex === 0) {
            handleClear();
          } else {
            handleComplete();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusArea('input');
          break;
        default:
          break;
      }
      return;
    }
  }, [focusArea, selectedItemIndex, selectedActionIndex, items, inputValue, navigate]);

  useEffect(function () {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return function () {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleScan(inputValue.trim());
      setInputValue('');
    }
  }

  function handleScan(value: string) {
    if (scanMode === 'location') {
      setLocation(value);
      setScanMode('item');
      writeLog('INFO', 'OPERATION', '棚卸ロケーション設定: ' + value);
      setToast({ message: 'ロケーション: ' + value, type: 'success' });
    } else {
      if (!location) {
        setToast({ message: '先にロケーションをスキャンしてください', type: 'error' });
        return;
      }

      var existingIndex = items.findIndex(function (item) {
        return item.code === value;
      });

      if (existingIndex >= 0) {
        var newItems = items.slice();
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        setItems(newItems);
        writeLog('INFO', 'SCAN', '棚卸スキャン(加算): ' + value + ' x' + newItems[existingIndex].quantity);
      } else {
        var newItem: InventoryItem = {
          id: generateId(),
          code: value,
          quantity: 1,
          scannedAt: new Date().toISOString(),
        };
        setItems(function (prev) { return prev.concat([newItem]); });
        writeLog('INFO', 'SCAN', '棚卸スキャン(新規): ' + value);
      }

      setToast({ message: value + ' を読取', type: 'success' });
    }
  }

  function handleDeleteItem(index: number) {
    var deletedItem = items[index];
    var newItems = items.slice();
    newItems.splice(index, 1);
    setItems(newItems);
    writeLog('INFO', 'OPERATION', '棚卸アイテム削除: ' + deletedItem.code);
    setToast({ message: deletedItem.code + ' を削除', type: 'info' });

    if (newItems.length === 0) {
      setFocusArea('input');
    } else if (selectedItemIndex >= newItems.length) {
      setSelectedItemIndex(newItems.length - 1);
    }
  }

  function handleClear() {
    setItems([]);
    setLocation('');
    setScanMode('location');
    setFocusArea('input');
    writeLog('INFO', 'OPERATION', '棚卸データクリア');
    setToast({ message: 'データをクリアしました', type: 'info' });
  }

  function handleComplete() {
    if (items.length === 0) {
      setToast({ message: '読取データがありません', type: 'error' });
      return;
    }

    writeLog('INFO', 'OPERATION', '棚卸完了: ロケーション=' + location + ', 件数=' + items.length);
    setToast({ message: '棚卸を完了しました (' + items.length + '件)', type: 'success' });

    setItems([]);
    setLocation('');
    setScanMode('location');
    setFocusArea('input');
  }

  var totalQuantity = items.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  return (
    <AppLayout title="棚卸">
      <div className={styles.container}>
        {/* モード・ロケーション表示 */}
        <div className={styles.infoRow}>
          <div className={styles.modeIndicator}>
            <span className={scanMode === 'location' ? styles.modeActive : styles.modeInactive}>
              LOC
            </span>
            <span className={scanMode === 'item' ? styles.modeActive : styles.modeInactive}>
              商品
            </span>
          </div>
          <div className={styles.locationDisplay}>
            {location || '(未設定)'}
          </div>
        </div>

        {/* スキャン入力 */}
        <div className={styles.inputSection}>
          <input
            ref={inputRef}
            type="text"
            className={focusArea === 'input' ? styles.inputFocused : styles.input}
            value={inputValue}
            onChange={function (e) { setInputValue(e.target.value); }}
            onKeyDown={handleInputKeyDown}
            onFocus={function () { setFocusArea('input'); }}
            placeholder={scanMode === 'location' ? 'ロケーションをスキャン...' : '商品をスキャン...'}
          />
        </div>

        {/* 読取結果 */}
        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>読取結果</span>
            <span className={styles.resultCount}>{items.length}品目/{totalQuantity}点</span>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyList}>
              <span>データなし</span>
            </div>
          ) : (
            <ul ref={listRef} className={styles.itemList}>
              {items.map(function (item, index) {
                var isSelected = focusArea === 'list' && index === selectedItemIndex;
                return (
                  <li
                    key={item.id}
                    className={isSelected ? styles.itemSelected : styles.item}
                    onClick={function () {
                      setFocusArea('list');
                      setSelectedItemIndex(index);
                    }}
                  >
                    <span className={styles.itemCode}>{item.code}</span>
                    <span className={styles.itemQty}>×{item.quantity}</span>
                    {isSelected && <span className={styles.deleteHint}>DEL:削除</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* アクションボタン */}
        <div className={styles.actions}>
          <button
            className={focusArea === 'actions' && selectedActionIndex === 0 ? styles.btnClearFocused : styles.btnClear}
            onClick={handleClear}
          >
            クリア
          </button>
          <button
            className={focusArea === 'actions' && selectedActionIndex === 1 ? styles.btnCompleteFocused : styles.btnComplete}
            onClick={handleComplete}
            disabled={items.length === 0}
          >
            完了
          </button>
        </div>

        {/* 操作ヒント */}
        <div className={styles.hint}>
          ↑↓:選択 DEL:削除 Enter:決定
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={function () { setToast(null); }}
          duration={2000}
        />
      )}
    </AppLayout>
  );
}
