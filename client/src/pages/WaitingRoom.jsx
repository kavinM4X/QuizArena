import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';
import styles from './WaitingRoom.module.css';

const WaitingRoom = () => {
  const { quizCode } = useParams();
  const code = quizCode?.toUpperCase();
  const { player } = usePlayer();
  const { socketRef } = useSocket();
  const navigate = useNavigate();

  const [count, setCount] = useState(1);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!player) {
      navigate(`/join?code=${code}`);
      return;
    }

    // Poll until socket connects, then join
    const tryJoin = () => {
      const socket = socketRef.current;
      if (socket?.connected && !joinedRef.current) {
        joinedRef.current = true;
        socket.emit('quiz:join', {
          quizCode: code,
          participantId: player.participantId,
          name: player.name,
          avatar: player.avatar || '🦊',
        });
      }
    };

    const interval = setInterval(tryJoin, 200);
    tryJoin();

    return () => clearInterval(interval);
  }, [code, player, socketRef]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onCount = ({ count: c }) => setCount(c);
    const onStarted = (data) => navigate(`/play/${code}`);
    const onQuestionChanged = () => navigate(`/play/${code}`);

    socket.on('participant:count', onCount);
    socket.on('quiz:started', onStarted);
    socket.on('question:changed', onQuestionChanged);

    return () => {
      socket.off('participant:count', onCount);
      socket.off('quiz:started', onStarted);
      socket.off('question:changed', onQuestionChanged);
    };
  }, [socketRef.current, code, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Animated pulse rings */}
        <div className={styles.pulseWrap}>
          <div className={styles.pulseRing} />
          <div className={`${styles.pulseRing} ${styles.d2}`} />
          <div className={`${styles.pulseRing} ${styles.d3}`} />
          <div className={styles.pulseCore}>{count}</div>
        </div>

        <h2 className={styles.title}>Waiting for host to start…</h2>
        <p className={styles.sub}>
          Please wait — the quiz will begin automatically.<br />Don't close this screen.
        </p>

        {/* Quiz code chip */}
        <div className={styles.codeCard}>
          <span className={styles.codeLbl}>Quiz Code&nbsp;</span>
          <span className={`${styles.codeVal} mono`}>{code}</span>
        </div>

        {/* Player name & avatar */}
        <div className={styles.playerBadge}>
          <span style={{ fontSize: '20px', marginRight: '6px' }}>{player?.avatar || '🦊'}</span>
          Playing as <strong>{player?.name}</strong>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
