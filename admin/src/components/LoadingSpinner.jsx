import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 24, color = 'var(--gold)' }) => (
  <span
    className={styles.spinner}
    style={{ width: size, height: size, borderTopColor: color }}
    aria-label="Loading"
  />
);

export default LoadingSpinner;
