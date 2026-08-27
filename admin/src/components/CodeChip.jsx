import styles from './CodeChip.module.css';
import toast from 'react-hot-toast';

const CodeChip = ({ code, onRegenerate }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!'));
  };

  return (
    <div className={styles.chip}>
      <div>
        <div className={styles.lbl}>Quiz Code (auto-generated)</div>
        <div className={styles.val} onClick={handleCopy} title="Click to copy">{code}</div>
      </div>
      {onRegenerate && (
        <button className={styles.regenBtn} onClick={onRegenerate} type="button">
          Regenerate
        </button>
      )}
    </div>
  );
};

export default CodeChip;
