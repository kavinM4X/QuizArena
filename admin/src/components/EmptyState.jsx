import styles from './EmptyState.module.css';

const EmptyState = ({ title = 'Nothing here yet', description = '', action }) => (
  <div className={styles.wrap}>
    <div className={styles.icon}>📋</div>
    <h3 className={styles.title}>{title}</h3>
    {description && <p className={styles.desc}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default EmptyState;
