import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { getScannedData, removeScannedData, clearScannedData } from '../services/storageService';
import { writeLog } from '../services/logService';
import type { ScannedData } from '../types';
import styles from './DataListPage.module.css';

type FocusArea = 'list' | 'actions';

export function DataListPage() {
  var navigate = useNavigate();
  var [data, setData] = useState<ScannedData[]>(getScannedData);
  var [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  var [confirmClear, setConfirmClear] = useState(false);
  var [focusArea] = useState<FocusArea>('list');
  var [selectedIndex, setSelectedIndex] = useState(0);
  var [actionIndex, setActionIndex] = useState(0); // 0: 全削除, 1: キャンセル
  var listRef = useRef<HTMLUListElement>(null);

  // 選択アイテムをスクロールで表示
  useEffect(function () {
    if (focusArea === 'list' && listRef.current && data.length > 0) {
      var selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, focusArea, data.length]);

  // グローバルキーハンドラ
  var handleKeyDown = useCallback(function (e: KeyboardEvent) {
    // 確認ダイアログ表示中
    if (confirmClear) {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          setActionIndex(function (prev) { return prev === 0 ? 1 : 0; });
          break;
        case 'Enter':
          e.preventDefault();
          if (actionIndex === 0) {
            handleClearAll();
          } else {
            setConfirmClear(false);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          setConfirmClear(false);
          break;
        default:
          break;
      }
      return;
    }

    // リストフォーカス中
    if (focusArea === 'list') {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex < data.length - 1) {
            setSelectedIndex(selectedIndex + 1);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (data.length > 0) {
            handleDelete(data[selectedIndex].id, data[selectedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          navigate('/');
          break;
        case 'Enter':
          e.preventDefault();
          if (data.length > 0) {
            setConfirmClear(true);
            setActionIndex(1); // デフォルトはキャンセル
          }
          break;
        default:
          break;
      }
    }
  }, [focusArea, selectedIndex, data, confirmClear, actionIndex, navigate]);

  useEffect(function () {
    window.addEventListener('keydown', handleKeyDown);
    return function () {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  var handleDelete = useCallback(function (id: string, value: string) {
    removeScannedData(id);
    var newData = getScannedData();
    setData(newData);
    setToast({ message: '削除: ' + value, type: 'info' });
    writeLog('INFO', 'OPERATION', 'データ確認画面: 個別削除 [' + value + ']');

    // インデックス調整
    if (newData.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= newData.length) {
      setSelectedIndex(newData.length - 1);
    }
  }, [selectedIndex]);

  var handleClearAll = useCallback(function () {
    clearScannedData();
    setData([]);
    setConfirmClear(false);
    setSelectedIndex(0);
    setToast({ message: '全データを削除しました', type: 'success' });
    writeLog('INFO', 'OPERATION', 'データ確認画面: 全件削除');
  }, []);

  var formatTime = function (iso: string) {
    var d = new Date(iso);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  };

  return (
    <AppLayout title="データ確認">
      <div className={styles.container}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <StatusBadge count={data.length} label="件" />
          {data.length > 0 && (
            <button
              className={styles.clearButton}
              onClick={function () { setConfirmClear(true); setActionIndex(1); }}
            >
              全削除
            </button>
          )}
        </div>

        {/* 確認ダイアログ */}
        {confirmClear && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>
                全{data.length}件のデータを<br />削除しますか？
              </p>
              <div className={styles.confirmButtons}>
                <button
                  className={actionIndex === 0 ? styles.confirmYesFocused : styles.confirmYes}
                  onClick={handleClearAll}
                >
                  削除
                </button>
                <button
                  className={actionIndex === 1 ? styles.confirmNoFocused : styles.confirmNo}
                  onClick={function () { setConfirmClear(false); }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* リスト */}
        {data.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <span>蓄積データはありません</span>
          </div>
        ) : (
          <ul ref={listRef} className={styles.list}>
            {data.map(function (item, index) {
              var isSelected = index === selectedIndex;
              return (
                <li
                  key={item.id}
                  className={isSelected ? styles.itemSelected : styles.item}
                  onClick={function () { setSelectedIndex(index); }}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemIndex}>{index + 1}</span>
                    <div className={styles.itemDetail}>
                      <span className={styles.itemValue}>{item.value}</span>
                      <span className={styles.itemTime}>{formatTime(item.scannedAt)}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className={styles.deleteHint}>DEL:削除</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* 操作ヒント */}
        <div className={styles.hint}>
          ↑↓:選択 DEL:削除 Enter:全削除
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={function () { setToast(null); }}
        />
      )}
    </AppLayout>
  );
}
