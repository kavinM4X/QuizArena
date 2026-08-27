import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { getCachedAdminData } from '../utils/adminCache';
import Navbar from '../components/Navbar';
import Leaderboard from '../components/Leaderboard';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './LiveControl.module.css';

const LiveControl = () => {
  const { quizCode } = useParams();
  const navigate = useNavigate();
  const code = quizCode?.toUpperCase();

  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [reactions, setReactions] = useState([]);
  const socketRef = useRef(null);

  /* ── Fetch quiz data ── */
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getCachedAdminData(`live_data_${code}`, async () => {
          const [qRes, pRes, rRes] = await Promise.all([
            api.get(`/quiz/${code}`),
            api.get(`/quiz/${code}/participants`),
            api.get(`/quiz/${code}/results`),
          ]);
          return {
            quiz: qRes.data.quiz,
            participants: pRes.data.participants || [],
            leaderboard: rRes.data.leaderboard || [],
          };
        });
        setQuiz(data.quiz);
        setParticipants(data.participants);
        setLeaderboard(data.leaderboard);
      } catch (err) {
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [code]);

  /* ── Socket connection ── */
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://quizarena-server-dhaj.onrender.com', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('admin:join', { quizCode: code });
    });

    socket.on('participant:list', ({ participants: list }) => {
      setParticipants(list || []);
    });

    socket.on('participant:joined', ({ name, avatar, onlineCount }) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.name === name);
        if (!exists) return [...prev, { name, avatar: avatar || '🦊', isConnected: true }];
        return prev.map((p) => p.name === name ? { ...p, isConnected: true, avatar: avatar || p.avatar } : p);
      });
      toast.success(`${avatar || '🦊'} ${name} joined!`, { duration: 2000 });
    });

    socket.on('participant:left', ({ name }) => {
      setParticipants((prev) => prev.map((p) => p.name === name ? { ...p, isConnected: false } : p));
    });

    socket.on('leaderboard:update', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
    });

    socket.on('timer:update', ({ timeRemaining: t }) => {
      setTimeRemaining(t);
    });

    socket.on('reaction:received', (reaction) => {
      const rx = {
        ...reaction,
        left: Math.floor(Math.random() * 75) + 10,
      };
      setReactions((prev) => [...prev.slice(-20), rx]);
    });

    socket.on('quiz:ended', () => {
      toast.success('Quiz ended!');
      navigate(`/results/${code}`);
    });

    return () => socket.disconnect();
  }, [code, navigate]);

  /* ── Actions ── */
  const action = async (type, label) => {
    setActionLoading(type);
    try {
      await api.post(`/quiz/${code}/${type}`);
      if (type === 'start') toast.success('Quiz started!');
      if (type === 'pause') toast('Quiz paused', { icon: '⏸️' });
      if (type === 'resume') toast.success('Quiz resumed!');
      if (type === 'next') toast('Next question sent', { icon: '➡️' });
      if (type === 'end') {
        toast.success('Quiz ended');
        navigate(`/results/${code}`);
      }
      // Refresh quiz state
      const { data } = await api.get(`/quiz/${code}`);
      setQuiz(data.quiz);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed: ${label}`);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.center}><LoadingSpinner size={40} /></div>
      </div>
    );
  }

  if (!quiz) return null;

  const onlineCount = participants.filter((p) => p.isConnected !== false).length;
  const currentQ = quiz.currentQuestionIndex >= 0 ? quiz.questions[quiz.currentQuestionIndex] : null;
  const isLive = quiz.status === 'live';
  const isPaused = quiz.status === 'paused';
  const isPending = quiz.status === 'pending';

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Floating Emoji Reactions Overlay */}
      <div className={styles.reactionOverlay}>
        {reactions.map((r) => (
          <div key={r.id} className={styles.floatingEmoji} style={{ left: `${r.left}%` }}>
            {r.emoji}
          </div>
        ))}
      </div>

      <main className={styles.main}>
        {/* Quiz Code Display */}
        <div className={styles.liveCodeWrap}>
          <div className={styles.liveCodeLbl}>Quiz Code</div>
          <div className={styles.liveCodeVal}>{code}</div>
        </div>

        {/* Participants strip */}
        <div className={styles.participantsStrip}>
          <div className={styles.playerChipsGrid}>
            {participants.map((p) => (
              <div
                key={p.name}
                className={`${styles.playerChip} ${p.isConnected === false ? styles.chipDisconnected : ''}`}
                title={p.name}
              >
                <span className={styles.chipAvatar}>{p.avatar || '🦊'}</span>
                <span className={styles.chipName}>{p.name}</span>
              </div>
            ))}
          </div>
          <div className={styles.pCount}><b>{onlineCount}</b> joined</div>
        </div>

        {/* Timer */}
        {(isLive || isPaused) && timeRemaining !== null && (
          <div className={styles.timerBar}>
            <span className={styles.timerVal}>⏱ {timeRemaining}s</span>
            {currentQ && (
              <span className={styles.currentQ}>
                Q{quiz.currentQuestionIndex + 1}/{quiz.questions.length}: {currentQ.question.slice(0, 50)}…
              </span>
            )}
          </div>
        )}

        {/* Control Grid */}
        <div className={styles.ctrlGrid}>
          {isPending && (
            <Button variant="violet" size="sm" loading={actionLoading === 'start'} onClick={() => action('start', 'Start')}>
              ▶ Start Quiz
            </Button>
          )}
          {isLive && (
            <Button variant="outline" size="sm" loading={actionLoading === 'pause'} onClick={() => action('pause', 'Pause')}>
              ⏸ Pause
            </Button>
          )}
          {isPaused && (
            <Button variant="violet" size="sm" loading={actionLoading === 'resume'} onClick={() => action('resume', 'Resume')}>
              ▶ Resume
            </Button>
          )}
          {(isLive || isPaused) && (
            <Button variant="outline" size="sm" loading={actionLoading === 'next'} onClick={() => action('next', 'Next')}>
              Next Question →
            </Button>
          )}
        </div>

        {(isLive || isPaused || quiz.status === 'ended') && (
          <div className={styles.endWrap}>
            <Button variant="danger" size="sm" loading={actionLoading === 'end'} onClick={() => action('end', 'End')}>
              End Quiz
            </Button>
          </div>
        )}

        {/* Live Leaderboard */}
        <div className={styles.sectionLbl}>Live Leaderboard</div>
        <Leaderboard entries={leaderboard} />
      </main>
    </div>
  );
};

export default LiveControl;
