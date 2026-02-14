import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { writeLog } from '../services/logService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  fetchInventoryConfig,
  fetchProductByBarcode,
} from '../services/inventoryService';
import type { InventoryRecord, InventoryConfig } from '../types';
import styles from './InventoryPage.module.css';

export function InventoryPage() {
  const navigate = useNavigate();

  // 棚卸設定（バックエンドDBから取得）
  const [config, setConfig] = useState<InventoryConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // フォーム状態
  const [inventoryDate, setInventoryDate] = useState(formatDate(new Date()));
  const [barcodeInput, setBarcodeInput] = useState('');
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 初回: バックエンドから棚卸設定を取得
  useEffect(function () {
    let cancelled = false;
    async function loadConfig() {
      const result = await fetchInventoryConfig();
      if (!cancelled) {
        setConfig(result);
        setConfigLoading(false);
        writeLog('INFO', 'SYSTEM', '棚卸設定ロード完了: mode=' + result.mode);
      }
    }
    loadConfig();
    return function () { cancelled = true; };
  }, []);

  // バーコード入力にフォーカス
  useEffect(function () {
    if (!configLoading && config && config.mode === 'online' && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [configLoading, config]);

  // 選択アイテムをスクロールで表示
  useEffect(function () {
    if (listRef.current && items.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, items.length]);

  // 日付をYYYY/MM/DD形式で表示用に変換
  function formatDateDisplay(dateStr: string): string {
    return dateStr.replace(/-/g, '/');
  }

  // 曜日取得
  function getDayOfWeek(dateStr: string): string {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  }

  // 登録日時のフォーマット
  function formatRegisteredAt(isoStr: string): string {
    const d = new Date(isoStr);
    return formatDateTime(d).replace(/-/g, '/');
  }

  // アイテム削除
  const handleDeleteItem = useCallback(function (index: number) {
    setItems(function (prev) {
      const deleted = prev[index];
      const newItems = prev.slice();
      newItems.splice(index, 1);
      writeLog('INFO', 'OPERATION', '棚卸アイテム削除: ' + deleted.id);
      setToast({ message: deleted.id + ' を削除', type: 'info' });

      // インデックス調整
      if (newItems.length === 0) {
        setSelectedIndex(0);
      } else if (index >= newItems.length) {
        setSelectedIndex(newItems.length - 1);
      }

      return newItems;
    });
  }, []);

  // リスト部分のキーボード操作（グローバル）
  const handleListKeyDown = useCallback(function (e: KeyboardEvent) {
    // バーコード入力中はリストキー操作を無効化
    if (document.activeElement === barcodeRef.current) return;
    // 日付入力中もスキップ
    if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(function (prev) {
          return prev > 0 ? prev - 1 : prev;
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(function (prev) {
          return prev < items.length - 1 ? prev + 1 : prev;
        });
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (items.length > 0) {
          handleDeleteItem(selectedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        navigate('/');
        break;
      default:
        break;
    }
  }, [items.length, selectedIndex, handleDeleteItem, navigate]);

  useEffect(function () {
    window.addEventListener('keydown', handleListKeyDown);
    return function () {
      window.removeEventListener('keydown', handleListKeyDown);
    };
  }, [handleListKeyDown]);

  // ローディング中
  if (configLoading) {
    return (
      <AppLayout title="棚卸登録">
        <div className={styles.container}>
          <div className={styles.loadingMessage}>棚卸設定を読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  // オフラインの時は画面を開けないようにする
  if (config && config.mode === 'offline') {
    return (
      <AppLayout title="棚卸登録">
        <div className={styles.container}>
          <div className={styles.offlineMessage}>
            オフラインモードのため棚卸機能は利用できません。
            <br />
            サーバーに接続してください。
          </div>
        </div>
      </AppLayout>
    );
  }

  // ヘッダーの日付表示
  const headerDateStr = formatDateDisplay(inventoryDate) + '(' + getDayOfWeek(inventoryDate) + ')';

  // ログインユーザー名取得
  const loggedInUser = sessionStorage.getItem('loggedInUser') || '';

  // バーコードスキャン → サーバーから品番取得 → リストに追加
  async function handleScanBarcode() {
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    // 重複チェック
    const exists = items.some(function (item) { return item.id === barcode; });
    if (exists) {
      setToast({ message: 'このIDは既に登録されています', type: 'error' });
      setBarcodeInput('');
      if (barcodeRef.current) barcodeRef.current.focus();
      return;
    }

    // オンライン時: サーバーを見に行って品番を取得表示する
    const product = await fetchProductByBarcode(barcode);
    if (product) {
      setItems(function (prev) { return prev.concat([product]); });
      setToast({ message: barcode + ' を読取', type: 'success' });
    } else {
      // 品番が見つからなくても登録（品番なしで）
      const newItem: InventoryRecord = {
        id: barcode,
        hinban: '',
        kata: '',
        joudai: 0,
        registeredAt: new Date().toISOString(),
      };
      setItems(function (prev) { return prev.concat([newItem]); });
      setToast({ message: barcode + ' を読取（品番情報なし）', type: 'info' });
    }

    setBarcodeInput('');
    if (barcodeRef.current) barcodeRef.current.focus();
  }

  // 入力でEnterキー
  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanBarcode();
    }
  }

  return (
    <AppLayout title="棚卸登録" headerRight={
      <span className={styles.headerInfo}>
        <span className={styles.headerDate}>{headerDateStr}</span>
        <span className={styles.headerUser}>{loggedInUser}</span>
      </span>
    }>
      <div className={styles.container}>
        {/* 入力エリア: 棚卸日付 + ID */}
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>棚卸日<br />付</label>
            <input
              type="date"
              className={styles.dateInput}
              value={inventoryDate}
              onChange={function (e) { setInventoryDate(e.target.value); }}
            />
          </div>
          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>ID</label>
            <input
              ref={barcodeRef}
              type="text"
              className={styles.barcodeInput}
              value={barcodeInput}
              onChange={function (e) { setBarcodeInput(e.target.value); }}
              onKeyDown={handleBarcodeKeyDown}
              placeholder=""
            />
          </div>
        </div>

        {/* 件数ヘッダー */}
        <div className={styles.listHeader}>
          <StatusBadge count={items.length} label="件" />
        </div>

        {/* リスト */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <span>スキャンデータはありません</span>
          </div>
        ) : (
          <ul ref={listRef} className={styles.list}>
            {items.map(function (item, index) {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={item.id}
                  className={isSelected ? styles.itemSelected : styles.item}
                  onClick={function () { setSelectedIndex(index); }}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemIndex}>{index + 1}</span>
                    <div className={styles.itemDetail}>
                      <span className={styles.itemValue}>{item.id}</span>
                      <span className={styles.itemSub}>
                        {item.hinban ? item.hinban : '---'}
                        {item.kata ? ' / ' + item.kata : ''}
                        {item.joudai ? ' / ¥' + item.joudai : ''}
                      </span>
                      <span className={styles.itemTime}>{formatRegisteredAt(item.registeredAt)}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <button
                      className={styles.deleteButton}
                      onClick={function (e) { e.stopPropagation(); handleDeleteItem(index); }}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* 操作ヒント */}
        <div className={styles.hint}>
          ↑↓:選択 DEL:削除
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
