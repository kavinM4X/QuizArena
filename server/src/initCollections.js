require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Quiz = require('./models/Quiz');
const Participant = require('./models/Participant');

async function initCollections() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Atlas DB:', mongoose.connection.name);

    // Create collections explicitly so they show in MongoDB Atlas GUI
    await Admin.createCollection();
    console.log('✅ Created "admins" collection');

    await Quiz.createCollection();
    console.log('✅ Created "quizzes" collection');

    await Participant.createCollection();
    console.log('✅ Created "participants" collection');

    console.log('\n🎉 Success! All collections initialized on MongoDB Atlas.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing collections:', error.message);
    process.exit(1);
  }
}

initCollections();
