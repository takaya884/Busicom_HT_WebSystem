import { useCallback, useEffect, useRef } from 'react';
import { addScannedData } from '../services/storageService';
import { generateId } from '../utils/dateUtils';

interface UseScannerOptions {
  onScan: (value: string) => void;
}

/**
 * HTバーコードスキャナー用カスタムフック
 *
 * HTのバーコードリーダーはキーボード入力としてデータを送信し、
 * 最後にEnterキー(またはTab)を送る仕組み。
 * テキストボックスにフォーカスがあれば自動的に入力される。
 */
export function useScanner({ onScan }: UseScannerOptions) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      const item = {
        id: generateId(),
        value: trimmed,
        scannedAt: new Date().toISOString(),
      };
      addScannedData(item);
      onScan(trimmed);
    },
    [onScan]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const input = inputRef.current;
        if (input && input.value.trim()) {
          handleScan(input.value);
          input.value = '';
        }
      }
    },
    [handleScan]
  );

  // マウント時にフォーカスを設定
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return { inputRef, handleKeyDown };
}
