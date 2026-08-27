import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, type = 'button', onClick, fullWidth = true, className = '' }) => (
  <button
    type={type}
    disabled={disabled || loading}
    onClick={onClick}
    className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
  >
    {loading ? <span className={styles.spinner} /> : children}
  </button>
);

export default Button;
