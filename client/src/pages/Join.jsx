import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { usePlayer } from '../context/PlayerContext';
import Button from '../components/Button';
import styles from './Join.module.css';

const AVATARS = ['🦊', '🐱', '🦁', '🐶', '🐸', '🚀', '👑', '⚡', '🎯', '🔥', '🦄', '🤖', '🐼', '🐯', '🐙', '👾'];

const Join = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase() || '';
  const { savePlayer } = usePlayer();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [takenAvatars, setTakenAvatars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) return;
    const fetchQuizDetails = async () => {
      try {
        const { data } = await api.get(`/quiz/${code}`);
        const taken = data.takenAvatars || [];
        setTakenAvatars(taken);

        // Pick first untaken avatar as default
        const available = AVATARS.find((a) => !taken.includes(a));
        if (available) {
          setAvatar(available);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuizDetails();
  }, [code]);

  const handleStart = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error('Please enter your name');
    if (trimmedName.length < 2) return toast.error('Name must be at least 2 characters');

    if (takenAvatars.includes(avatar)) {
      return toast.error('This avatar is already taken by another player! Please choose another.');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/quiz/join', {
        quizCode: code,
        name: trimmedName,
        avatar,
      });
      if (data.success) {
        savePlayer({
          name: trimmedName,
          avatar: data.participant.avatar || avatar,
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
          <h1 className={styles.title}>Join Quiz Session</h1>
          <p className={styles.sub}>Choose a unique avatar and display name for the leaderboard.</p>

          {/* Avatar Selector */}
          <div className={styles.avatarSection}>
            <div className={styles.selectedDisplay}>{avatar}</div>
            <div className={styles.avatarGrid}>
              {AVATARS.map((emoji) => {
                const isTaken = takenAvatars.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    disabled={isTaken}
                    className={`${styles.avatarTile} ${avatar === emoji ? styles.avatarActive : ''} ${isTaken ? styles.avatarTaken : ''}`}
                    onClick={() => !isTaken && setAvatar(emoji)}
                    title={isTaken ? 'Already taken by another player' : `Select ${emoji}`}
                  >
                    {emoji}
                    {isTaken && <span className={styles.takenBadge}>✕</span>}
                  </button>
                );
              })}
            </div>
          </div>
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
            Start Game →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Join;
