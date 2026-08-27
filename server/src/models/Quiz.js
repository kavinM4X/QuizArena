const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: 'Each question must have exactly 4 options',
    },
  },
  // Index of the correct answer (0–3)
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    quizCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    // pending | live | paused | ended
    status: {
      type: String,
      enum: ['pending', 'live', 'paused', 'ended'],
      default: 'pending',
    },
    // Duration in seconds per question
    duration: {
      type: Number,
      default: 30,
      min: 5,
      max: 120,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: 'Quiz must have at least 1 question',
      },
    },
    currentQuestionIndex: {
      type: Number,
      default: -1, // -1 means not started
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
