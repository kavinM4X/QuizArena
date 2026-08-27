import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import CodeChip from '../components/CodeChip';
import styles from './CreateQuiz.module.css';

const LETTERS = ['A', 'B', 'C', 'D'];
const COLORS = ['a', 'b', 'c', 'd'];

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 1000,
});

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const CreateQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cloneQuiz = location.state?.cloneQuiz;

  const [questions, setQuestions] = useState(() => {
    if (cloneQuiz?.questions?.length) {
      return cloneQuiz.questions.map((q) => ({
        question: q.question || '',
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correctAnswer: q.correctAnswer ?? 0,
        points: q.points ?? 1000,
      }));
    }
    return [emptyQuestion()];
  });
  const [quizCode, setQuizCode] = useState(generateCode);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(cloneQuiz?.title ? `Copy of ${cloneQuiz.title}` : '');
  const [description, setDescription] = useState(cloneQuiz?.description || '');
  const [duration, setDuration] = useState(cloneQuiz?.duration || 30);
  const [scoringMode, setScoringMode] = useState(cloneQuiz?.scoringMode || 'speed');

  /* ── Question helpers ── */
  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const deleteQuestion = (idx) => {
    if (questions.length === 1) return toast.error('Must have at least 1 question');
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (qIdx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!title.trim()) return toast.error('Quiz title is required');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return toast.error(`Question ${i + 1} text is empty`);
      if (q.options.some((o) => !o.trim())) return toast.error(`Question ${i + 1} has empty options`);
    }

    setSaving(true);
    try {
      const { data } = await api.post('/quiz/create', {
        title,
        description,
        duration,
        scoringMode,
        quizCode,
        questions,
      });
      toast.success('Quiz created! Share the code with players.');
      navigate(`/live/${data.quiz.quizCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <h2 className={styles.pageTitle}>{cloneQuiz ? 'Edit Cloned Quiz' : 'Create Quiz'}</h2>
        </div>

        {cloneQuiz && (
          <div style={{
            background: 'rgba(139, 127, 255, 0.12)',
            border: '1px solid var(--violet)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--violet)'
          }}>
            📋 Cloned from <strong>{cloneQuiz.title}</strong> — customize details & questions below.
          </div>
        )}

        {/* Title */}
        <Input
          label="Quiz Title"
          id="quiz-title"
          placeholder="e.g. General Knowledge Sprint"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Description (optional)"
          id="quiz-desc"
          placeholder="Short description of this quiz"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Duration */}
        <div className={styles.durationRow}>
          <label className={styles.durationLabel}>Time per question (seconds)</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              min={3}
              max={600}
              className={styles.durationInput}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              placeholder="e.g. 30"
            />
            <span className={styles.secSuffix}>seconds</span>
          </div>

          <div className={styles.presetRow}>
            {[10, 15, 20, 30, 45, 60, 90, 120].map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.presetBtn} ${duration === s ? styles.presetActive : ''}`}
                onClick={() => setDuration(s)}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Scoring Mode Toggle */}
        <div className={styles.scoringRow}>
          <label className={styles.durationLabel}>Scoring Rule</label>
          <div className={styles.scoringGrid}>
            <button
              type="button"
              className={`${styles.scoringCard} ${scoringMode === 'speed' ? styles.scoringActive : ''}`}
              onClick={() => setScoringMode('speed')}
            >
              <span className={styles.scoringIcon}>⚡</span>
              <div className={styles.scoringText}>
                <div className={styles.scoringTitle}>Speed Bonus (Kahoot Style)</div>
                <div className={styles.scoringSub}>Base pts + extra bonus for faster answers</div>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.scoringCard} ${scoringMode === 'flat' ? styles.scoringActive : ''}`}
              onClick={() => setScoringMode('flat')}
            >
              <span className={styles.scoringIcon}>🎯</span>
              <div className={styles.scoringText}>
                <div className={styles.scoringTitle}>Flat / Fixed Points</div>
                <div className={styles.scoringSub}>Exact points per correct answer (no speed bonus)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Quiz Code */}
        <CodeChip code={quizCode} onRegenerate={() => setQuizCode(generateCode())} />

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <div key={qIdx} className={styles.questionBlock}>
            <div className={styles.qHeader}>
              <span className={styles.qNum}>Question {qIdx + 1} of {questions.length}</span>
              {questions.length > 1 && (
                <button className={styles.deleteBtn} onClick={() => deleteQuestion(qIdx)}>✕ Remove</button>
              )}
            </div>

            <div className={styles.card}>
              {/* Question text */}
              <div className={styles.fieldInner}>
                <input
                  className={styles.qInput}
                  placeholder="Type your question here"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                />
              </div>

              {/* Score / Points Level */}
              <div className={styles.pointsBar}>
                <label className={styles.pointsLabel}>Score Level:</label>
                <div className={styles.pointsGroup}>
                  {[100, 500, 1000, 2000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      className={`${styles.pointsPill} ${q.points === pts ? styles.pointsActive : ''}`}
                      onClick={() => updateQuestion(qIdx, 'points', pts)}
                    >
                      ⭐ {pts} pts
                    </button>
                  ))}
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    className={styles.customPointsInput}
                    value={q.points || 1000}
                    onChange={(e) => updateQuestion(qIdx, 'points', Math.max(10, Number(e.target.value)))}
                    placeholder="Custom"
                    title="Custom points for this question"
                  />
                </div>
              </div>

              {/* Options */}
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className={styles.optRow}>
                  <div className={`${styles.optLetter} ${styles[COLORS[optIdx]]}`}>
                    {LETTERS[optIdx]}
                  </div>
                  <input
                    className={styles.optInput}
                    placeholder={`Option ${LETTERS[optIdx]}`}
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                  />
                  <div
                    className={`${styles.radioCheck} ${q.correctAnswer === optIdx ? styles.correct : ''}`}
                    onClick={() => updateQuestion(qIdx, 'correctAnswer', optIdx)}
                    title="Mark as correct"
                  />
                </div>
              ))}
              <p className={styles.correctHint}>Click the circle to mark the correct answer</p>
            </div>
          </div>
        ))}

        <button className={styles.addQBtn} onClick={addQuestion}>+ Add Question</button>

        <div className={styles.saveBar}>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save Quiz
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
