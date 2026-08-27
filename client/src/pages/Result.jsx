import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { usePlayer } from '../context/PlayerContext';
import Leaderboard from '../components/Leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Result.module.css';

const Result = () => {
  const { quizCode } = useParams();
  const code = quizCode?.toUpperCase();
  const navigate = useNavigate();
  const { player, clearPlayer } = usePlayer();

  const [leaderboard, setLeaderboard] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get(`/quiz/${code}/results`);
        const lb = data.leaderboard || [];
        setLeaderboard(lb);
        if (player) {
          const me = lb.find((e) => e.name === player.name);
          setMyEntry(me || null);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchResults();
  }, [code, player]);

  const handlePlayAgain = () => {
    clearPlayer();
    navigate('/');
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}><LoadingSpinner size={40} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Score hero */}
        <div className={styles.scoreHero}>
          <div className={styles.scoreOf}>YOUR SCORE</div>
          <div className={styles.scoreBig}>{myEntry?.score ?? 0}</div>
        </div>

        {/* Metrics */}
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricNum} style={{ color: 'var(--teal)' }}>
              {myEntry?.correct ?? 0}/{(myEntry?.correct ?? 0) + (myEntry?.wrong ?? 0)}
            </div>
            <div className={styles.metricLbl}>Correct Answers</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricNum} style={{ color: 'var(--gold)' }}>
              #{myEntry?.rank ?? '—'}
            </div>
            <div className={styles.metricLbl}>Your Rank</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={styles.sectionLbl}>Top of leaderboard</div>
        <Leaderboard entries={leaderboard.slice(0, 5)} highlightName={player?.name} />

        <div className={styles.thankyou}>🎉 Thanks for playing — see you next round!</div>

        <button className={styles.playAgainBtn} onClick={handlePlayAgain}>
          Play Another Quiz
        </button>
      </div>
    </div>
  );
};

export default Result;
