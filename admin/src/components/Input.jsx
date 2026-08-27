import styles from './Input.module.css';

const Input = ({
  label,
  id,
  error,
  type = 'text',
  placeholder,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.field}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.inputError : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
};

export default Input;
