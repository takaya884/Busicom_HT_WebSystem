import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className={styles.header}>
      {!isHome && (
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ◀ 戻る
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
