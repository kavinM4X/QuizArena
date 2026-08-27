const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { joinLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const {
  createQuiz,
  getQuiz,
  joinQuiz,
  startQuiz,
  pauseQuiz,
  resumeQuiz,
  nextQuestion,
  submitAnswer,
  endQuiz,
  getResults,
  exportCSV,
  getAdminQuizzes,
  getParticipants,
} = require('../controllers/quizController');

// Admin — list all quizzes
router.get(['/', ''], protect, getAdminQuizzes);

// Create quiz (protected)
router.post(
  '/create',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('questions').isArray({ min: 1 }).withMessage('At least 1 question required'),
    body('questions.*.question').trim().notEmpty().withMessage('Question text required'),
    body('questions.*.options').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 options required'),
    body('questions.*.correctAnswer').isInt({ min: 0, max: 3 }).withMessage('correctAnswer must be 0–3'),
    validate,
  ],
  createQuiz
);

// Public — join quiz
router.post(
  '/join',
  joinLimiter,
  [
    body('quizCode').trim().notEmpty().withMessage('Quiz code required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    validate,
  ],
  joinQuiz
);

// Public — get quiz by code
router.get('/:code', getQuiz);

// Admin — get participants
router.get('/:code/participants', protect, getParticipants);

// Admin — control routes (all protected)
router.post('/:code/start', protect, startQuiz);
router.post('/:code/pause', protect, pauseQuiz);
router.post('/:code/resume', protect, resumeQuiz);
router.post('/:code/next', protect, nextQuestion);
router.post('/:code/end', protect, endQuiz);

// Public — submit answer
router.post(
  '/:code/answer',
  [
    body('participantId').notEmpty().withMessage('participantId required'),
    body('questionIndex').isInt({ min: 0 }).withMessage('questionIndex required'),
    body('selectedOption').isInt({ min: 0, max: 3 }).withMessage('selectedOption required'),
    validate,
  ],
  submitAnswer
);

// Admin — results & CSV
router.get('/:code/results', protect, getResults);
router.get('/:code/export-csv', protect, exportCSV);

module.exports = router;
