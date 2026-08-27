const Participant = require('../models/Participant');
const Quiz = require('../models/Quiz');
const { buildLeaderboard } = require('../services/quizService');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Player: join quiz room ─────────────────────────────────────────────
    socket.on('quiz:join', async ({ quizCode, participantId, name }) => {
      try {
        const code = quizCode.toUpperCase();
        socket.join(`quiz:${code}`);

        // Update socketId
        if (participantId) {
          await Participant.findByIdAndUpdate(participantId, {
            socketId: socket.id,
            isConnected: true,
          });
        }

        // Count online participants
        const onlineCount = await Participant.countDocuments({
          quizCode: code,
          isConnected: true,
        });

        // Notify admin room
        io.to(`admin:${code}`).emit('participant:joined', {
          participantId,
          name,
          onlineCount,
        });

        // Broadcast updated participant count to all in quiz room
        io.to(`quiz:${code}`).emit('participant:count', { count: onlineCount });

        console.log(`👤 ${name} joined quiz ${code}`);
      } catch (err) {
        console.error('quiz:join error', err);
      }
    });

    // ─── Admin: join admin room ─────────────────────────────────────────────
    socket.on('admin:join', async ({ quizCode }) => {
      const code = quizCode.toUpperCase();
      socket.join(`admin:${code}`);
      console.log(`🛡️ Admin joined room admin:${code}`);

      // Send current participant list
      const participants = await Participant.find({ quizCode: code }).select('name score isConnected');
      socket.emit('participant:list', { participants });
    });

    // ─── Player: submit answer ──────────────────────────────────────────────
    // (Answers are submitted via REST POST /api/quiz/:code/answer for reliability)
    // This event is kept for real-time UX feedback only
    socket.on('answer:submit', ({ quizCode, participantId, questionIndex, selectedOption }) => {
      // REST handler does the scoring; socket just acknowledges
      socket.emit('answer:ack', { received: true, questionIndex, selectedOption });
    });

    // ─── Admin events ───────────────────────────────────────────────────────
    socket.on('quiz:start', ({ quizCode }) => {
      // Trigger via REST; this is a secondary path
    });

    socket.on('quiz:pause', ({ quizCode }) => {});
    socket.on('quiz:resume', ({ quizCode }) => {});
    socket.on('quiz:next', ({ quizCode }) => {});
    socket.on('quiz:end', ({ quizCode }) => {});

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        // Mark participant as disconnected
        const participant = await Participant.findOneAndUpdate(
          { socketId: socket.id },
          { isConnected: false },
          { new: true }
        );

        if (participant) {
          const code = participant.quizCode;
          const onlineCount = await Participant.countDocuments({
            quizCode: code,
            isConnected: true,
          });

          io.to(`admin:${code}`).emit('participant:left', {
            name: participant.name,
            onlineCount,
          });
          io.to(`quiz:${code}`).emit('participant:count', { count: onlineCount });

          console.log(`👋 ${participant.name} disconnected from ${code}`);
        }
      } catch (err) {
        console.error('disconnect error', err);
      }
    });

    // ─── Reconnect ──────────────────────────────────────────────────────────
    socket.on('player:reconnect', async ({ quizCode, participantId }) => {
      try {
        const code = quizCode.toUpperCase();
        socket.join(`quiz:${code}`);

        await Participant.findByIdAndUpdate(participantId, {
          socketId: socket.id,
          isConnected: true,
        });

        const quiz = await Quiz.findOne({ quizCode: code });
        if (quiz && quiz.status === 'live') {
          const question = quiz.questions[quiz.currentQuestionIndex];
          socket.emit('quiz:state', {
            status: quiz.status,
            currentQuestionIndex: quiz.currentQuestionIndex,
            question: {
              index: quiz.currentQuestionIndex,
              total: quiz.questions.length,
              question: question.question,
              options: question.options,
            },
            duration: quiz.duration,
          });
        }

        console.log(`🔄 Participant ${participantId} reconnected to ${code}`);
      } catch (err) {
        console.error('player:reconnect error', err);
      }
    });
  });
};

module.exports = socketHandler;
