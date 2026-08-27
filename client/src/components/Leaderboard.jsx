import styles from './Leaderboard.module.css';

const Leaderboard = ({ entries = [], highlightName = '' }) => {
  if (!entries.length) {
    return <p className={styles.empty}>Leaderboard is empty.</p>;
  }

  return (
    <div className={styles.list}>
      {entries.map((entry, idx) => (
        <div
          key={entry.name + idx}
          className={`${styles.row} ${entry.name === highlightName ? styles.highlight : ''}`}
        >
          <div className={`${styles.rank} ${idx === 0 ? styles.gold : ''}`}>{entry.rank}</div>
          <div className={styles.name}>
            <span style={{ marginRight: '6px' }}>{entry.avatar || '🦊'}</span>
            {entry.name === highlightName ? 'You' : entry.name}
          </div>
          <div className={styles.score}>{entry.score}</div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
