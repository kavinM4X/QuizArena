import styles from './Leaderboard.module.css';

const Leaderboard = ({ entries = [] }) => {
  if (!entries.length) {
    return <p className={styles.empty}>No participants yet.</p>;
  }

  return (
    <div className={styles.list}>
      {entries.map((entry, idx) => (
        <div key={entry.name + idx} className={styles.row}>
          <div className={`${styles.rank} ${idx === 0 ? styles.gold : ''}`}>
            {idx + 1}
          </div>
          <div className={styles.name}>{entry.name}</div>
          <div className={styles.score}>{entry.score}</div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
