import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { usePlayer } from '../context/PlayerContext';
import Button from '../components/Button';
import styles from './Join.module.css';

const Join = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase() || '';
  const { savePlayer } = usePlayer();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error('Please enter your name');
    if (trimmedName.length < 2) return toast.error('Name must be at least 2 characters');

    setLoading(true);
    try {
      const { data } = await api.post('/quiz/join', { quizCode: code, name: trimmedName });
      if (data.success) {
        savePlayer({
          name: trimmedName,
          quizCode: code,
          participantId: data.participant._id,
        });
        navigate(`/waiting/${code}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!code) {
    navigate('/');
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.centerCol}>
        <div className={styles.topBlock}>
          <span className={styles.codeBadge}>Code: {code}</span>
          <h1 className={styles.title}>What should we call you?</h1>
          <p className={styles.sub}>This name will appear on the live leaderboard.</p>
        </div>

        <div className={styles.bottomBlock}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="player-name">Your Name</label>
            <input
              id="player-name"
              className={styles.nameInput}
              type="text"
              placeholder="e.g. Rhea Nair"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              autoFocus
            />
          </div>
          <Button variant="primary" loading={loading} onClick={handleStart}>
            Start →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Join;
