import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  count: number;
  label: string;
}

export function StatusBadge({ count, label }: StatusBadgeProps) {
  return (
    <div className={styles.badge}>
      <span className={styles.count}>{count}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
