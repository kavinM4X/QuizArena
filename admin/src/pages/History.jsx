import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import styles from './History.module.css';

const History = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | ended | live | pending
  const [downloadingCode, setDownloadingCode] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get('/quiz/');
        setQuizzes(data.quizzes || []);
      } catch (err) {
        console.error('Fetch history error:', err);
        toast.error('Failed to load quiz history');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleExportCSV = async (quizCode, e) => {
    e.stopPropagation();
    setDownloadingCode(quizCode);
    try {
      const response = await api.get(`/quiz/${quizCode}/export-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${quizCode}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`CSV for code ${quizCode} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setDownloadingCode(null);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.quizCode?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ended') return q.status === 'ended';
    if (statusFilter === 'live') return q.status === 'live' || q.status === 'paused';
    if (statusFilter === 'pending') return q.status === 'pending';

    return true;
  });

  const totalCount = quizzes.length;
  const endedCount = quizzes.filter((q) => q.status === 'ended').length;
  const totalPlayers = quizzes.reduce((sum, q) => sum + (q.participantCount || 0), 0);

  const getStatusBadge = (status) => {
    if (status === 'live') return <span className="badge live">Live</span>;
    if (status === 'paused') return <span className="badge pending">Paused</span>;
    if (status === 'ended') return <span className="badge ended">Completed</span>;
    return <span className="badge pending">Pending</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClone = async (quizCode, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.get(`/quiz/${quizCode}`);
      if (data.success && data.quiz) {
        navigate('/create-quiz', { state: { cloneQuiz: data.quiz } });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quiz for cloning');
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.headerSection}>
          <div className={styles.eyebrow}>Quiz Archives</div>
          <h1 className={styles.title}>Quiz History</h1>
          <p className={styles.subtitle}>
            Overview of all past and active quiz sessions, participant statistics, and result exports.
          </p>
        </div>

        {/* Stats Summary */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalCount}</span>
            <span className={styles.statLabel}>Total Sessions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{endedCount}</span>
            <span className={styles.statLabel}>Completed Quizzes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalPlayers}</span>
            <span className={styles.statLabel}>Total Participants</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by quiz title or 6-digit code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.tabBtn} ${statusFilter === 'all' ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({quizzes.length})
            </button>
            <button
              className={`${styles.tabBtn} ${statusFilter === 'ended' ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter('ended')}
            >
              Completed ({quizzes.filter((q) => q.status === 'ended').length})
            </button>
            <button
              className={`${styles.tabBtn} ${statusFilter === 'live' ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter('live')}
            >
              Active ({quizzes.filter((q) => q.status === 'live' || q.status === 'paused').length})
            </button>
            <button
              className={`${styles.tabBtn} ${statusFilter === 'pending' ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({quizzes.filter((q) => q.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className={styles.center}>
            <LoadingSpinner size={40} />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState
            title="No quizzes found"
            description={
              search
                ? `No quizzes matched "${search}"`
                : 'There are no quiz sessions matching the selected filter.'
            }
          />
        ) : (
          <div className={styles.quizGrid}>
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                className={styles.quizCard}
                onClick={() => {
                  if (quiz.status === 'live' || quiz.status === 'paused') {
                    navigate(`/live/${quiz.quizCode}`);
                  } else {
                    navigate(`/results/${quiz.quizCode}`);
                  }
                }}
              >
                <div className={styles.quizMainInfo}>
                  <div className={styles.cardHeader}>
                    <span className={styles.quizTitle}>{quiz.title}</span>
                    {getStatusBadge(quiz.status)}
                  </div>
                  <div className={styles.quizMeta}>
                    <span>Code: <strong className={styles.codeBadge}>{quiz.quizCode}</strong></span>
                    <span>👥 {quiz.participantCount || 0} participants</span>
                    <span>⏱ {quiz.duration || 30}s / question</span>
                    <span>📅 {formatDate(quiz.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.actionsGroup}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => handleClone(quiz.quizCode, e)}
                    title="Clone / Duplicate this quiz"
                  >
                    📋 Clone
                  </button>

                  {quiz.status === 'ended' && (
                    <>
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => handleExportCSV(quiz.quizCode, e)}
                        disabled={downloadingCode === quiz.quizCode}
                      >
                        {downloadingCode === quiz.quizCode ? 'Downloading...' : '⬇ CSV'}
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/results/${quiz.quizCode}`);
                        }}
                      >
                        View Results →
                      </button>
                    </>
                  )}

                  {(quiz.status === 'live' || quiz.status === 'paused' || quiz.status === 'pending') && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/live/${quiz.quizCode}`);
                      }}
                    >
                      Control Session →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
