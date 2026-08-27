import styles from './OptionTile.module.css';

const LETTERS = ['A', 'B', 'C', 'D'];
const COLOR_KEYS = ['a', 'b', 'c', 'd'];

/**
 * state: 'idle' | 'selected' | 'correct' | 'wrong'
 */
const OptionTile = ({ index, text, state = 'idle', onClick, disabled = false }) => {
  return (
    <div
      className={`${styles.tile} ${styles[COLOR_KEYS[index]]} ${styles[state]} ${disabled ? styles.disabled : ''}`}
      onClick={!disabled ? onClick : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) onClick?.(); }}
      aria-pressed={state === 'selected'}
    >
      <div className={styles.letter}>{LETTERS[index]}</div>
      <div className={styles.text}>{text}</div>
    </div>
  );
};

export default OptionTile;
