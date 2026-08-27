const Participant = require('../models/Participant');
const Quiz = require('../models/Quiz');

/**
 * Generate a unique 6-character alphanumeric quiz code (uppercase)
 */
const generateQuizCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;

  while (exists) {
    code = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    exists = await Quiz.exists({ quizCode: code });
  }

  return code;
};

/**
 * Calculate score for a correct answer with speed bonus
 * @param {number} timeTaken - seconds taken
 * @param {number} totalTime - total allowed seconds
 * @returns {number} points
 */
const calculateScore = (timeTaken, totalTime) => {
  const BASE_SCORE = 1000;
  const MAX_SPEED_BONUS = 500;
  const ratio = Math.max(0, (totalTime - timeTaken) / totalTime);
  const speedBonus = Math.floor(ratio * MAX_SPEED_BONUS);
  return BASE_SCORE + speedBonus;
};

/**
 * Build a leaderboard array sorted by score descending
 */
const buildLeaderboard = async (quizCode) => {
  const participants = await Participant.find({ quizCode })
    .select('name score answers')
    .sort({ score: -1, joinedAt: 1 });

  return participants.map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    score: p.score,
    correct: p.answers.filter((a) => a.isCorrect).length,
    wrong: p.answers.filter((a) => !a.isCorrect).length,
    total: p.answers.length,
  }));
};

/**
 * Generate a CSV string from leaderboard data
 */
const generateCSV = (leaderboard, quizTitle) => {
  const header = 'Rank,Player Name,Score,Correct,Wrong\n';
  const rows = leaderboard
    .map((r) => `${r.rank},"${r.name}",${r.score},${r.correct},${r.wrong}`)
    .join('\n');
  return header + rows;
};

module.exports = { generateQuizCode, calculateScore, buildLeaderboard, generateCSV };
