import styles from './LoadingSpinner.module.css';
const LoadingSpinner = ({ size = 32 }) => (
  <span className={styles.s} style={{ width: size, height: size }} aria-label="Loading" />
);
export default LoadingSpinner;
