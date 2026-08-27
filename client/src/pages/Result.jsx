import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { usePlayer } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';
import Leaderboard from '../components/Leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Result.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

const Result = () => {
  const { quizCode } = useParams();
  const code = quizCode?.toUpperCase();
  const navigate = useNavigate();
  const { player, clearPlayer } = usePlayer();
  const { socketRef } = useSocket();

  const [leaderboard, setLeaderboard] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateLeaderboardData = (lb) => {
    setLeaderboard(lb);
    if (player) {
      const me = lb.find((e) => e.name === player.name);
      setMyEntry(me || null);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get(`/quiz/${code}/results`);
        const lb = data.leaderboard || [];
        updateLeaderboardData(lb);
      } catch (err) {
        console.error('fetchResults error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [code, player]);

  /* ── Socket live updates ── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (player) {
      socket.emit('quiz:join', {
        quizCode: code,
        participantId: player.participantId,
        name: player.name,
        avatar: player.avatar || '🦊',
      });
    }

    const onLbUpdate = ({ leaderboard: lb }) => updateLeaderboardData(lb);
    const onEnded = ({ leaderboard: lb }) => updateLeaderboardData(lb);

    socket.on('leaderboard:update', onLbUpdate);
    socket.on('quiz:ended', onEnded);

    return () => {
      socket.off('leaderboard:update', onLbUpdate);
      socket.off('quiz:ended', onEnded);
    };
  }, [socketRef.current, code, player]);

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

  const rankIdx = myEntry ? myEntry.rank - 1 : -1;
  const rankMedal = rankIdx >= 0 && rankIdx < 3 ? MEDALS[rankIdx] : null;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Score & Rank Hero */}
        <div className={styles.scoreHero}>
          <div className={styles.avatarBig}>{player?.avatar || myEntry?.avatar || '🦊'}</div>

          {rankMedal ? (
            <div className={styles.medalBadge}>
              {rankMedal} PLACE #{myEntry?.rank}
            </div>
          ) : (
            <div className={styles.scoreOf}>
              RANK #{myEntry?.rank || '—'}
            </div>
          )}

          <div className={styles.scoreBig}>{myEntry?.score ?? 0} pts</div>
          <div className={styles.playerNameHero}>{player?.name || 'Player'}</div>
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
            <div className={styles.metricLbl}>Your Final Rank</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={styles.sectionLbl}>Live Quiz Leaderboard</div>
        <Leaderboard entries={leaderboard.slice(0, 10)} highlightName={player?.name} />

        <div className={styles.thankyou}>🎉 Great game! See you in the next arena!</div>

        <button className={styles.playAgainBtn} onClick={handlePlayAgain}>
          Play Another Quiz
        </button>
      </div>
    </div>
  );
};

export default Result;
