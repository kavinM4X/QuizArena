import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h2 className={styles.title}>Page not found</h2>
        <p className={styles.sub}>The page you're looking for doesn't exist.</p>
        <button className={styles.btn} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    </div>
  );
};

export default NotFound;
