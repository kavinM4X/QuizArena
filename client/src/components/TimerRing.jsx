import styles from './TimerRing.module.css';

const TimerRing = ({ timeRemaining, duration }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius; // ≈ 138
  const ratio = Math.max(0, timeRemaining / duration);
  const offset = circumference * (1 - ratio);

  const color = timeRemaining <= 5
    ? 'var(--danger)'
    : timeRemaining <= 10
    ? 'var(--coral)'
    : 'var(--gold)';

  return (
    <div className={styles.ring}>
      <svg width="52" height="52">
        <circle
          cx="26" cy="26" r={radius}
          stroke="var(--surface-2)" strokeWidth="4" fill="none"
        />
        <circle
          cx="26" cy="26" r={radius}
          stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className={styles.val} style={{ color }}>{timeRemaining}</div>
    </div>
  );
};

export default TimerRing;
