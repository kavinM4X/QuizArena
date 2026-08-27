import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import styles from './Results.module.css';

const RANK_STYLE = ['g1', 'g2', 'g3'];

const Results = () => {
  const { quizCode } = useParams();
  const navigate = useNavigate();
  const code = quizCode?.toUpperCase();

  const [quiz, setQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get(`/quiz/${code}/results`);
        setQuiz(data.quiz);
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [code]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/quiz/${code}/export-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${code}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
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

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <h2 className={styles.pageTitle}>Final Results</h2>
        </div>

        {quiz && (
          <div className={styles.quizInfo}>
            <span className={styles.quizTitle}>{quiz.title}</span>
            <span className={styles.quizCode}>Code: {code}</span>
          </div>
        )}

        {leaderboard.length === 0 ? (
          <EmptyState title="No results yet" description="No participants answered any questions." />
        ) : (
          <div className={styles.resultList}>
            {leaderboard.map((entry, idx) => (
              <div key={entry.name} className={styles.resRow}>
                <div className={`${styles.rankBadge} ${idx < 3 ? styles[RANK_STYLE[idx]] : ''}`}>
                  {entry.rank}
                </div>
                <div className={styles.resInfo}>
                  <div className={styles.resName}>{entry.name}</div>
                  <div className={styles.resMeta}>
                    ✅ {entry.correct} correct &nbsp;·&nbsp; ❌ {entry.wrong} wrong
                  </div>
                </div>
                <div className={`${styles.resScore} ${idx === 0 ? styles.goldScore : ''}`}>
                  {entry.score}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.bottomBar}>
          <Button variant="outline" loading={exporting} onClick={handleExportCSV}>
            ⬇ Download Results (CSV)
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Results;
