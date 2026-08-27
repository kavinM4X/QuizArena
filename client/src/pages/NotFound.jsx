import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <h2 className={styles.title}>Page not found</h2>
      <p className={styles.sub}>This page doesn't exist. Did you get the right quiz code?</p>
      <button className={styles.btn} onClick={() => navigate('/')}>Go Home</button>
    </div>
  );
};
export default NotFound;
