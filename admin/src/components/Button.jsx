import styles from './Button.module.css';
import LoadingSpinner from './LoadingSpinner';

/**
 * variant: 'primary' | 'violet' | 'outline' | 'danger' | 'success'
 * size: 'md' | 'sm' | 'lg'
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
      {...props}
    >
      {loading ? <LoadingSpinner size={16} /> : children}
    </button>
  );
};

export default Button;
