import type { ReactNode } from 'react';
import { Header } from './Header';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className={styles.container}>
      <Header title={title} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
