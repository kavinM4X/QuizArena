# QuizArena 🎯

A real-time quiz platform — like Kahoot, built with the MERN stack and Socket.IO.

## Architecture

```
QuizArena/
├── admin/     → React 19 + Vite  (http://localhost:5173)
├── client/    → React 19 + Vite  (http://localhost:5174)
└── server/    → Node.js + Express + MongoDB + Socket.IO  (http://localhost:5000)
```

## Features

### Admin App
- JWT login & registration
- Dashboard with live stats
- Create quizzes with multi-option questions (auto-generated 6-char code)
- Live Control: start / pause / resume / next question / end quiz
- Real-time leaderboard via Socket.IO
- Final results with CSV export

### Client App
- No login required — players just enter a quiz code + name
- Animated waiting room with live participant count
- Quiz play with color-coded option tiles, countdown timer ring
- Answer submission with speed bonus scoring
- Result page with personal score, rank, and leaderboard

### Server
- RESTful API + Socket.IO rooms
- Server-side scoring: `1000 base + up to 500 speed bonus`
- JWT authentication for admin routes
- Duplicate name & answer prevention
- Reconnect support
- CSV export

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Socket.IO Client, CSS Modules |
| Backend | Node.js, Express, Mongoose, Socket.IO, JWT, bcrypt |
| Database | MongoDB (local via MongoDB Compass) |
| Dev tools | nodemon |

## Installation

```bash
# Clone / open folder
cd QuizArena

# Install server dependencies
cd server && npm install

# Install admin dependencies
cd ../admin && npm install

# Install client dependencies
cd ../client && npm install
```

## Environment Variables

### `server/.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/quizarena
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5174
ADMIN_URL=http://localhost:5173
```

### `admin/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### `client/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Running Locally

Open **3 separate terminals**:

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Admin App
cd admin
npm run dev
# → http://localhost:5173

# Terminal 3 — Client App
cd client
npm run dev
# → http://localhost:5174
```

> Make sure MongoDB is running locally (or connected via MongoDB Compass) before starting the server.

## REST API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/register` | — | Register admin |
| POST | `/api/admin/login` | — | Admin login |
| GET | `/api/admin/profile` | ✅ | Get admin profile |
| GET | `/api/quiz` | ✅ | List admin's quizzes |
| POST | `/api/quiz/create` | ✅ | Create quiz |
| GET | `/api/quiz/:code` | — | Get quiz by code |
| POST | `/api/quiz/join` | — | Player join quiz |
| POST | `/api/quiz/:code/start` | ✅ | Start quiz |
| POST | `/api/quiz/:code/pause` | ✅ | Pause quiz |
| POST | `/api/quiz/:code/resume` | ✅ | Resume quiz |
| POST | `/api/quiz/:code/next` | ✅ | Next question |
| POST | `/api/quiz/:code/answer` | — | Submit answer |
| POST | `/api/quiz/:code/end` | ✅ | End quiz |
| GET | `/api/quiz/:code/results` | ✅ | Get results |
| GET | `/api/quiz/:code/export-csv` | ✅ | Download CSV |

## Socket.IO Events

### Client → Server
| Event | Payload |
|---|---|
| `quiz:join` | `{ quizCode, participantId, name }` |
| `admin:join` | `{ quizCode }` |
| `answer:submit` | `{ quizCode, participantId, questionIndex, selectedOption }` |
| `player:reconnect` | `{ quizCode, participantId }` |

### Server → Client
| Event | Description |
|---|---|
| `quiz:started` | Quiz has started — navigate to play |
| `question:changed` | New question — includes question data and duration |
| `timer:update` | Timer tick with `timeRemaining` |
| `timer:up` | Time expired for current question |
| `leaderboard:update` | Updated scores |
| `quiz:paused` | Quiz paused by admin |
| `quiz:resumed` | Quiz resumed |
| `quiz:ended` | Quiz ended — navigate to results |
| `participant:joined` | A player joined (admin room) |
| `participant:left` | A player disconnected (admin room) |
| `participant:count` | Current online player count |

## Scoring

```
Correct answer:  1000 (base) + up to 500 (speed bonus)
Wrong answer:    0
Speed bonus:     floor((timeRemaining / totalTime) * 500)
```

## Deployment

| App | Target URL |
|---|---|
| Admin | https://admin.quizarena.com |
| Client | https://play.quizarena.com |
| API | https://api.quizarena.com |

Update `.env` files with production URLs before deploying.

## Future Improvements

- [ ] Image/media questions
- [ ] Multiple quiz modes (timed / survey)
- [ ] Google OAuth for admins
- [ ] Public quiz discovery
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
