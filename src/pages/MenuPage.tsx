import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { getScannedDataCount } from '../services/storageService';
import type { MenuItem } from '../types';
import styles from './MenuPage.module.css';

/**
 * メニュー定義
 * 画面を追加する場合はこの配列にアイテムを追加する
 */
const MENU_ITEMS: MenuItem[] = [
  {
    id: 'scan',
    label: 'データ読取',
    path: '/scan',
    icon: '📖',
    description: 'バーコード読取・蓄積',
  },
  {
    id: 'send',
    label: 'サーバー送信',
    path: '/send',
    icon: '📡',
    description: '蓄積データを送信',
  },
];

export function MenuPage() {
  const navigate = useNavigate();
  const dataCount = getScannedDataCount();

  return (
    <AppLayout title="メニュー">
      <div className={styles.statusRow}>
        <StatusBadge count={dataCount} label="件 蓄積中" />
      </div>
      <div className={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className={styles.menuButton}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.description}>{item.description}</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
