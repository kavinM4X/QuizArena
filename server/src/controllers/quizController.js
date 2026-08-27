const Quiz = require('../models/Quiz');
const Participant = require('../models/Participant');
const { generateQuizCode, calculateScore, buildLeaderboard, generateCSV } = require('../services/quizService');

// Active timers: quizCode -> { intervalId, timeRemaining }
const activeTimers = {};

// In-memory answered set: `${quizCode}:${questionIndex}:${participantId}`
const answeredSet = new Set();

// ─── POST /api/quiz/create ───────────────────────────────────────────────────
const createQuiz = async (req, res) => {
  try {
    const { title, description, duration, scoringMode, questions, quizCode: requestedCode } = req.body;

    let quizCode = (requestedCode || '').trim().toUpperCase();
    if (quizCode) {
      const exists = await Quiz.exists({ quizCode });
      if (exists) {
        quizCode = await generateQuizCode();
      }
    } else {
      quizCode = await generateQuizCode();
    }

    const quiz = await Quiz.create({
      title,
      description: description || '',
      quizCode,
      duration: duration || 30,
      scoringMode: scoringMode || 'speed',
      questions,
      createdBy: req.admin._id,
    });

    return res.status(201).json({ success: true, quiz });
  } catch (error) {
    console.error('createQuiz:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const MASTER_AVATARS = ['🦊', '🐱', '🦁', '🐶', '🐸', '🚀', '👑', '⚡', '🎯', '🔥', '🦄', '🤖', '🐼', '🐯', '🐙', '👾'];

// ─── GET /api/quiz/:code ─────────────────────────────────────────────────────
const getQuiz = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const takenAvatars = await Participant.find({ quizCode: code }).distinct('avatar');
    return res.status(200).json({ success: true, quiz, takenAvatars });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/join ─────────────────────────────────────────────────────
const joinQuiz = async (req, res) => {
  try {
    const { quizCode, name, avatar } = req.body;
    const code = quizCode.toUpperCase();

    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Quiz has already ended' });
    }

    // Prevent duplicate name
    const existing = await Participant.findOne({ quizCode: code, name: name.trim() });
    if (existing) {
      // Return existing participant (reconnect scenario)
      return res.status(200).json({ success: true, participant: existing, reconnect: true });
    }

    // Enforce unique avatar per quiz session
    const takenAvatars = await Participant.find({ quizCode: code }).distinct('avatar');
    let assignedAvatar = avatar;

    if (!assignedAvatar || takenAvatars.includes(assignedAvatar)) {
      const available = MASTER_AVATARS.filter((a) => !takenAvatars.includes(a));
      if (available.length > 0) {
        assignedAvatar = available[Math.floor(Math.random() * available.length)];
      } else {
        assignedAvatar = MASTER_AVATARS[Math.floor(Math.random() * MASTER_AVATARS.length)];
      }
    }

    const participant = await Participant.create({
      name: name.trim(),
      quizCode: code,
      avatar: assignedAvatar,
    });
    return res.status(201).json({ success: true, participant, reconnect: false });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Name already taken in this quiz' });
    }
    console.error('joinQuiz:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/start ──────────────────────────────────────────────
const startQuiz = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.status === 'live') return res.status(400).json({ success: false, message: 'Quiz already live' });

    quiz.status = 'live';
    quiz.currentQuestionIndex = 0;
    await quiz.save();

    // Attach io to req via app
    const io = req.app.get('io');
    if (io) {
      const question = quiz.questions[0];
      io.to(`quiz:${code}`).emit('quiz:started', {
        quizCode: code,
        question: {
          index: 0,
          total: quiz.questions.length,
          question: question.question,
          options: question.options,
        },
        duration: quiz.duration,
      });
      io.to(`admin:${code}`).emit('quiz:started', { quizCode: code });
      _startTimer(io, quiz, 0);
    }

    return res.status(200).json({ success: true, message: 'Quiz started' });
  } catch (error) {
    console.error('startQuiz:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/pause ──────────────────────────────────────────────
const pauseQuiz = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz || quiz.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Quiz is not live' });
    }

    quiz.status = 'paused';
    await quiz.save();

    if (activeTimers[code]) {
      clearInterval(activeTimers[code].intervalId);
    }

    const io = req.app.get('io');
    if (io) io.to(`quiz:${code}`).emit('quiz:paused', { quizCode: code });

    return res.status(200).json({ success: true, message: 'Quiz paused' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/resume ─────────────────────────────────────────────
const resumeQuiz = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz || quiz.status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Quiz is not paused' });
    }

    quiz.status = 'live';
    await quiz.save();

    const io = req.app.get('io');
    if (io) {
      const remaining = activeTimers[code]?.timeRemaining ?? quiz.duration;
      io.to(`quiz:${code}`).emit('quiz:resumed', { quizCode: code, timeRemaining: remaining });
      _resumeTimer(io, quiz, quiz.currentQuestionIndex, remaining);
    }

    return res.status(200).json({ success: true, message: 'Quiz resumed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/next ───────────────────────────────────────────────
const nextQuestion = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const nextIdx = quiz.currentQuestionIndex + 1;

    if (nextIdx >= quiz.questions.length) {
      return res.status(400).json({ success: false, message: 'No more questions. End the quiz.' });
    }

    if (activeTimers[code]) clearInterval(activeTimers[code].intervalId);

    quiz.currentQuestionIndex = nextIdx;
    await quiz.save();

    const io = req.app.get('io');
    if (io) {
      const question = quiz.questions[nextIdx];
      const payload = {
        index: nextIdx,
        total: quiz.questions.length,
        question: question.question,
        options: question.options,
        duration: quiz.duration,
      };
      io.to(`quiz:${code}`).emit('question:changed', payload);
      io.to(`admin:${code}`).emit('question:changed', payload);
      _startTimer(io, quiz, nextIdx);
    }

    return res.status(200).json({ success: true, questionIndex: nextIdx });
  } catch (error) {
    console.error('nextQuestion:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/answer ─────────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { participantId, questionIndex, selectedOption, timeTaken } = req.body;

    const answerKey = `${code}:${questionIndex}:${participantId}`;
    if (answeredSet.has(answerKey)) {
      return res.status(409).json({ success: false, message: 'Answer already submitted' });
    }
    answeredSet.add(answerKey);

    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz || quiz.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Quiz is not active' });
    }

    const question = quiz.questions[questionIndex];
    const isCorrect = question.correctAnswer === selectedOption;
    const basePoints = question?.points || 1000;
    const scoringMode = quiz.scoringMode || 'speed';
    const pointsEarned = isCorrect ? calculateScore(timeTaken, quiz.duration, basePoints, scoringMode) : 0;

    await Participant.findByIdAndUpdate(participantId, {
      $push: {
        answers: { questionIndex, selectedOption, isCorrect, timeTaken, pointsEarned },
      },
      $inc: { score: pointsEarned },
    });

    // Broadcast leaderboard update
    const io = req.app.get('io');
    if (io) {
      const leaderboard = await buildLeaderboard(code);
      io.to(`admin:${code}`).emit('leaderboard:update', { leaderboard });
      io.to(`quiz:${code}`).emit('leaderboard:update', { leaderboard });
    }

    return res.status(200).json({ success: true, isCorrect, pointsEarned });
  } catch (error) {
    console.error('submitAnswer:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/quiz/:code/end ────────────────────────────────────────────────
const endQuiz = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    if (activeTimers[code]) {
      clearInterval(activeTimers[code].intervalId);
      delete activeTimers[code];
    }

    quiz.status = 'ended';
    await quiz.save();

    const leaderboard = await buildLeaderboard(code);

    const io = req.app.get('io');
    if (io) {
      io.to(`quiz:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
      io.to(`admin:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
    }

    return res.status(200).json({ success: true, message: 'Quiz ended', leaderboard });
  } catch (error) {
    console.error('endQuiz:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/quiz/:code/results ─────────────────────────────────────────────
const getResults = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const leaderboard = await buildLeaderboard(code);
    return res.status(200).json({ success: true, quiz, leaderboard });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/quiz/:code/export-csv ──────────────────────────────────────────
const exportCSV = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const leaderboard = await buildLeaderboard(code);
    const csv = generateCSV(leaderboard, quiz.title);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results-${code}.csv"`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/quiz (admin dashboard list) ────────────────────────────────────
const getAdminQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.admin._id })
      .sort({ createdAt: -1 })
      .select('title quizCode status createdAt duration');

    // Attach participant count
    const quizzesWithCount = await Promise.all(
      quizzes.map(async (q) => {
        const count = await Participant.countDocuments({ quizCode: q.quizCode });
        return { ...q.toObject(), participantCount: count };
      })
    );

    return res.status(200).json({ success: true, quizzes: quizzesWithCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/quiz/:code/participants ─────────────────────────────────────────
const getParticipants = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const participants = await Participant.find({ quizCode: code }).select('name avatar score isConnected joinedAt');
    return res.status(200).json({ success: true, participants });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Private helpers ─────────────────────────────────────────────────────────

function _startTimer(io, quiz, questionIndex) {
  const code = quiz.quizCode;
  let timeRemaining = quiz.duration;

  if (activeTimers[code]) clearInterval(activeTimers[code].intervalId);

  const intervalId = setInterval(async () => {
    timeRemaining -= 1;
    io.to(`quiz:${code}`).emit('timer:update', { timeRemaining, duration: quiz.duration });
    io.to(`admin:${code}`).emit('timer:update', { timeRemaining, duration: quiz.duration });

    if (activeTimers[code]) activeTimers[code].timeRemaining = timeRemaining;

    if (timeRemaining <= 0) {
      clearInterval(intervalId);
      delete activeTimers[code];

      io.to(`quiz:${code}`).emit('timer:up', { questionIndex });
      io.to(`admin:${code}`).emit('timer:up', { questionIndex });

      // Automatically advance to next question (or end quiz if last question) after a 2.5s reveal buffer
      setTimeout(async () => {
        try {
          const updatedQuiz = await Quiz.findOne({ quizCode: code });
          if (!updatedQuiz || updatedQuiz.status !== 'live') return;

          const nextIdx = updatedQuiz.currentQuestionIndex + 1;
          if (nextIdx < updatedQuiz.questions.length) {
            updatedQuiz.currentQuestionIndex = nextIdx;
            await updatedQuiz.save();

            const question = updatedQuiz.questions[nextIdx];
            const payload = {
              index: nextIdx,
              total: updatedQuiz.questions.length,
              question: question.question,
              options: question.options,
              duration: updatedQuiz.duration,
            };
            io.to(`quiz:${code}`).emit('question:changed', payload);
            io.to(`admin:${code}`).emit('question:changed', payload);
            _startTimer(io, updatedQuiz, nextIdx);
          } else {
            // Last question completed -> auto-end quiz
            updatedQuiz.status = 'ended';
            await updatedQuiz.save();

            const leaderboard = await buildLeaderboard(code);
            io.to(`quiz:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
            io.to(`admin:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
          }
        } catch (err) {
          console.error('Auto-advance error:', err);
        }
      }, 2500);
    }
  }, 1000);

  activeTimers[code] = { intervalId, timeRemaining };
}

function _resumeTimer(io, quiz, questionIndex, timeRemaining) {
  const code = quiz.quizCode;
  let remaining = timeRemaining;

  const intervalId = setInterval(async () => {
    remaining -= 1;
    io.to(`quiz:${code}`).emit('timer:update', { timeRemaining: remaining, duration: quiz.duration });
    io.to(`admin:${code}`).emit('timer:update', { timeRemaining: remaining, duration: quiz.duration });

    if (activeTimers[code]) activeTimers[code].timeRemaining = remaining;

    if (remaining <= 0) {
      clearInterval(intervalId);
      delete activeTimers[code];

      io.to(`quiz:${code}`).emit('timer:up', { questionIndex });
      io.to(`admin:${code}`).emit('timer:up', { questionIndex });

      setTimeout(async () => {
        try {
          const updatedQuiz = await Quiz.findOne({ quizCode: code });
          if (!updatedQuiz || updatedQuiz.status !== 'live') return;

          const nextIdx = updatedQuiz.currentQuestionIndex + 1;
          if (nextIdx < updatedQuiz.questions.length) {
            updatedQuiz.currentQuestionIndex = nextIdx;
            await updatedQuiz.save();

            const question = updatedQuiz.questions[nextIdx];
            const payload = {
              index: nextIdx,
              total: updatedQuiz.questions.length,
              question: question.question,
              options: question.options,
              duration: updatedQuiz.duration,
            };
            io.to(`quiz:${code}`).emit('question:changed', payload);
            io.to(`admin:${code}`).emit('question:changed', payload);
            _startTimer(io, updatedQuiz, nextIdx);
          } else {
            updatedQuiz.status = 'ended';
            await updatedQuiz.save();

            const leaderboard = await buildLeaderboard(code);
            io.to(`quiz:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
            io.to(`admin:${code}`).emit('quiz:ended', { quizCode: code, leaderboard });
          }
        } catch (err) {
          console.error('Auto-advance error:', err);
        }
      }, 2500);
    }
  }, 1000);

  activeTimers[code] = { intervalId, timeRemaining: remaining };
}

module.exports = {
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
};
