import styles from './StatCard.module.css';

const StatCard = ({ num, label, accent = false, live = false }) => (
  <div className={`${styles.card} ${accent ? styles.accent : ''}`}>
    <div className={styles.num}>
      {live && <span className="stat-dot" />}
      {num}
    </div>
    <div className={styles.lbl}>{label}</div>
  </div>
);

export default StatCard;
