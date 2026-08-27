import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { usePlayer } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';
import TimerRing from '../components/TimerRing';
import OptionTile from '../components/OptionTile';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Play.module.css';

const Play = () => {
  const { quizCode } = useParams();
  const code = quizCode?.toUpperCase();
  const navigate = useNavigate();
  const { player } = usePlayer();
  const { socketRef } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);  // { index, total, question, options }
  const [duration, setDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [selected, setSelected] = useState(null);       // 0-3 | null
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);           // { isCorrect, pointsEarned, correctAnswer }
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const startTimeRef = useRef(null);
  const submittedRef = useRef(false);

  /* ── Load initial quiz state ── */
  useEffect(() => {
    if (!player) { navigate('/'); return; }

    const load = async () => {
      try {
        const { data } = await api.get(`/quiz/${code}`);
        const q = data.quiz;
        setQuiz(q);
        setDuration(q.duration);
        setTimeRemaining(q.duration);
        if (q.currentQuestionIndex >= 0) {
          const question = q.questions[q.currentQuestionIndex];
          setCurrentQ({
            index: q.currentQuestionIndex,
            total: q.questions.length,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
          });
        }
      } catch { toast.error('Failed to load quiz'); }
      finally { setLoading(false); }
    };
    load();
  }, [code]);

  /* ── Socket events ── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onQuestion = (data) => {
      setCurrentQ(data);
      setDuration(data.duration);
      setTimeRemaining(data.duration);
      setSelected(null);
      setSubmitted(false);
      setResult(null);
      submittedRef.current = false;
      startTimeRef.current = Date.now();
      setPaused(false);
    };

    const onTimer = ({ timeRemaining: t }) => setTimeRemaining(t);
    const onPaused = () => setPaused(true);
    const onResumed = () => setPaused(false);
    const onEnded = ({ leaderboard }) => navigate(`/result/${code}`);
    const onTimerUp = () => {
      if (!submittedRef.current) {
        setSubmitted(true);
        submittedRef.current = true;
        setResult({ isCorrect: false, pointsEarned: 0, timeUp: true });
      }
    };

    socket.on('question:changed', onQuestion);
    socket.on('timer:update', onTimer);
    socket.on('quiz:paused', onPaused);
    socket.on('quiz:resumed', onResumed);
    socket.on('quiz:ended', onEnded);
    socket.on('timer:up', onTimerUp);

    return () => {
      socket.off('question:changed', onQuestion);
      socket.off('timer:update', onTimer);
      socket.off('quiz:paused', onPaused);
      socket.off('quiz:resumed', onResumed);
      socket.off('quiz:ended', onEnded);
      socket.off('timer:up', onTimerUp);
    };
  }, [socketRef.current, code, navigate]);

  /* ── Submit answer ── */
  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || selected === null) return;
    submittedRef.current = true;
    setSubmitted(true);

    const timeTaken = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : duration - timeRemaining;

    try {
      const { data } = await api.post(`/quiz/${code}/answer`, {
        participantId: player.participantId,
        questionIndex: currentQ.index,
        selectedOption: selected,
        timeTaken,
      });
      setResult({
        isCorrect: data.isCorrect,
        pointsEarned: data.pointsEarned,
        correctAnswer: currentQ.correctAnswer,
      });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('already')) {
        setResult({ isCorrect: false, pointsEarned: 0, duplicate: true });
      }
    }
  }, [selected, currentQ, code, player, timeRemaining, duration]);

  const getOptionState = (idx) => {
    if (!submitted) return selected === idx ? 'selected' : 'idle';
    if (result?.correctAnswer === idx) return 'correct';
    if (selected === idx && !result?.isCorrect) return 'wrong';
    return 'idle';
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}><LoadingSpinner size={40} /></div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <p style={{ color: 'var(--mute)' }}>Waiting for the quiz to start…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <span className={`${styles.progress} mono`}>
          QUESTION {String(currentQ.index + 1).padStart(2, '0')} / {String(currentQ.total).padStart(2, '0')}
        </span>
        <TimerRing timeRemaining={paused ? timeRemaining : timeRemaining} duration={duration} />
      </div>

      {paused && (
        <div className={styles.pausedBanner}>⏸ Quiz is paused by the host</div>
      )}

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.questionText}>{currentQ.question}</div>

        <div className={styles.optGrid}>
          {currentQ.options.map((opt, idx) => (
            <OptionTile
              key={idx}
              index={idx}
              text={opt}
              state={getOptionState(idx)}
              onClick={() => !submitted && setSelected(idx)}
              disabled={submitted}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {!submitted ? (
          <Button
            variant="primary"
            disabled={selected === null}
            onClick={handleSubmit}
          >
            Submit Answer
          </Button>
        ) : (
          <div className={`${styles.resultBanner} ${result?.isCorrect ? styles.correct : styles.wrong}`}>
            {result?.timeUp
              ? "⏰ Time's up!"
              : result?.isCorrect
              ? `✅ Correct! +${result.pointsEarned} pts`
              : '❌ Wrong answer'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Play;
