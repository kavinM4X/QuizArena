import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
});

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [quizCode, setQuizCode] = useState(generateCode);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);

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
          <h2 className={styles.pageTitle}>Create Quiz</h2>
        </div>

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
          <select
            className={styles.durationSelect}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[10, 15, 20, 30, 45, 60, 90, 120].map((s) => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
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
