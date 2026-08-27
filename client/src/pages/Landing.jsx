import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Button from '../components/Button';
import styles from './Landing.module.css';

const Landing = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return toast.error('Please enter a quiz code');
    if (trimmed.length !== 6) return toast.error('Quiz code must be 6 characters');

    setLoading(true);
    try {
      const { data } = await api.get(`/quiz/${trimmed}`);
      if (!data.quiz) throw new Error('Not found');
      if (data.quiz.status === 'ended') return toast.error('This quiz has already ended');
      navigate(`/join?code=${trimmed}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quiz not found. Check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.centerCol}>
        {/* Top block */}
        <div className={styles.topBlock}>
          <div className={styles.logoMark}>Q</div>
          <h1 className={styles.title}>Welcome to QuizArena</h1>
          <p className={styles.sub}>Join a live quiz hosted by your teacher or team lead.</p>
        </div>

        {/* Code Input */}
        <div className={styles.bottomBlock}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="quiz-code">Enter Quiz Code</label>
            <input
              id="quiz-code"
              className={styles.codeInput}
              type="text"
              placeholder="ABC123"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoComplete="off"
              autoFocus
            />
          </div>
          <Button variant="primary" loading={loading} onClick={handleJoin}>
            Join Quiz →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
