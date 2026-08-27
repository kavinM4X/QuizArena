const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: Number, required: true }, // 0–3
  isCorrect: { type: Boolean, required: true },
  timeTaken: { type: Number, default: 0 }, // seconds taken to answer
  pointsEarned: { type: Number, default: 0 },
});

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      maxlength: [40, 'Name cannot exceed 40 characters'],
    },
    quizCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    avatar: {
      type: String,
      default: '🦊',
    },
    socketId: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index: a player name can only appear once per quiz
participantSchema.index({ quizCode: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Participant', participantSchema);
