import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get('/quiz');
        setQuizzes(data.quizzes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter((q) => q.status === 'live').length;
  const totalParticipants = quizzes.reduce((s, q) => s + (q.participantCount || 0), 0);

  const getStatusLabel = (status) => {
    if (status === 'live') return <span className="badge live">Live</span>;
    if (status === 'ended') return <span className="badge ended">Ended</span>;
    return <span className="badge pending">Pending</span>;
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        {/* Greeting */}
        <div className={styles.greet}>
          <div className={styles.eyebrow}>{today}</div>
          <h2 className={styles.welcome}>Welcome back, {admin?.name?.split(' ')[0] || 'Admin'}</h2>
        </div>

        {/* Stats */}
        <div className={styles.statGrid}>
          <StatCard num={totalQuizzes} label="Total Quizzes" />
          <StatCard num={activeQuizzes} label="Active Quiz" accent live={activeQuizzes > 0} />
          <div className={styles.fullStat}>
            <StatCard num={totalParticipants} label="Participants (all time)" />
          </div>
        </div>

        {/* Create Quiz CTA */}
        <Button variant="primary" onClick={() => navigate('/create-quiz')}>
          + Create Quiz
        </Button>

        {/* Recent Quizzes */}
        <div className={styles.sectionLbl}>Recent Quizzes</div>

        {loading ? (
          <div className={styles.center}><LoadingSpinner /></div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="No quizzes yet"
            description="Create your first quiz and start hosting live sessions."
          />
        ) : (
          <div className={styles.quizList}>
            {quizzes.slice(0, 10).map((q) => (
              <div
                key={q._id}
                className={styles.quizRow}
                onClick={() =>
                  q.status === 'live' || q.status === 'paused'
                    ? navigate(`/live/${q.quizCode}`)
                    : navigate(`/results/${q.quizCode}`)
                }
              >
                <div>
                  <div className={styles.quizName}>{q.title}</div>
                  <div className={styles.quizMeta}>
                    Code {q.quizCode} · {q.participantCount || 0} players
                  </div>
                </div>
                {getStatusLabel(q.status)}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
