# PrepSync - Interview Preparation Platform

PrepSync is a comprehensive interview preparation platform that combines AI-powered mock interviews with peer-to-peer interview sessions and resume analysis.

## Project Structure

```
PrepSync/
├── backend/          # Node.js/Express server with WebSocket support
├── frontend/         # React + Vite frontend application
└── README.md        # This file
```

## Prerequisites

Before running the application, ensure you have installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** (optional, for cloning)

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/prepsync

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Session Configuration
SESSION_SECRET=your_session_secret_key_here_change_in_production

# Google Generative AI Configuration
GEMINI_API_KEY=your_google_generative_ai_api_key_here

# Server Configuration
PORT=3000
```

**Key Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string. Update with your actual database credentials.
- `JWT_SECRET`: Generate a strong random string for JWT token signing.
- `SESSION_SECRET`: Generate a strong random string for session management.
- `GEMINI_API_KEY`: Get this from [Google Cloud Console](https://console.cloud.google.com/)
- `PORT`: Backend server port (default: 3000)

### 4. Set Up Database

Before running migrations, ensure PostgreSQL is running and create a database:

```bash
# Create database (in PostgreSQL shell or tools like pgAdmin)
CREATE DATABASE prepsync;
```

Then run Prisma migrations:

```bash
npx prisma migrate deploy
```

**Note:** The `postinstall` script in `package.json` will automatically run `prisma generate` and migrations when dependencies are installed.

### 5. (Optional) Seed Database

To populate the database with initial data:

```bash
node seed/seed.js
```

### 6. Start Backend Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

**Health Check:**
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2026-05-28T...",
  "uptime": ...
}
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (if needed)

Check `frontend/src/config/config.js` for API endpoint configuration. By default, it should point to:

```javascript
API_URL = http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

The frontend will typically start on `http://localhost:5173` (or another port if 5173 is busy).

Open your browser and navigate to the provided URL.

---

## Running Both Frontend and Backend Together

### Option 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Both will run simultaneously, and the frontend will communicate with the backend via the API.

### Option 2: Using Concurrently (from root directory)

If you want to run both from the root directory, install `concurrently`:

```bash
npm install -g concurrently
```

Then create a script in the root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm start\" \"cd frontend && npm run dev\""
  }
}
```

Run with:
```bash
npm run dev
```

---

## Available Scripts

### Backend Scripts

```bash
npm start       # Start the server
npm test        # Run tests (if configured)
```

### Frontend Scripts

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

---

## Project Features

### Backend Features
- **User Authentication** - Registration, login, JWT-based auth
- **AI Interviews** - Powered by Google Generative AI (Gemini)
- **Peer Interviews** - Real-time peer-to-peer interviews via WebSocket
- **Interview Management** - Create, schedule, and track interviews
- **Resume Analysis** - Upload and analyze resumes
- **File Uploads** - Recording and resume storage
- **Session Management** - Express sessions with secure cookies

### Frontend Features
- **User Dashboard** - Overview, profile, subscriptions
- **AI Interview Module** - Practice interviews with AI
- **Peer Interview Room** - Real-time video/audio with peers
- **Resume Uploader** - Upload and manage resumes
- **Subscription Management** - View and manage plans
- **Interview Reports** - Detailed performance analysis

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.io, WebSocket
- **AI**: Google Generative AI (Gemini)
- **File Storage**: Local file system with Multer

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios (in api.js)
- **Real-time**: Socket.io client

---

## Database Schema

Key Prisma models include:

- **User** - User accounts with subscriptions and roles
- **Subscription** - Plan types (FREE, PRO, ENTERPRISE)
- **PlanFeature** - Features available per subscription
- **Interview** - Interview records (AI-based and peer)
- **Resume** - Resume uploads
- **Report** - Interview performance reports
- **UserFeatureUsage** - Track feature usage quotas

For full schema, see [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

---

## WebSocket Endpoints

### AI Interview WebSocket
- **Path**: `/ws/ai-interview`
- **Auth**: Query parameter `token` (JWT)
- **Messages**: 
  - `start` - Begin AI interview
  - `answer` - Submit answer to AI question
  - `quit` - End interview

### Peer Interview Socket.io
- **Namespace**: `/peer-interview`
- **Events**:
  - `join-room` - Join interview room
  - `offer` - WebRTC offer for video/audio
  - `answer` - WebRTC answer
  - `ice-candidate` - ICE candidate for connection

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### User
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update profile
- `GET /user/subscription` - Get subscription info

### AI Interviews
- `POST /services/ai-interview/start` - Start interview
- `POST /services/ai-interview/submit-answer` - Submit answer

### Interviews
- `GET /interviews` - List interviews
- `POST /interviews/create` - Create interview
- `POST /interviews/schedule` - Schedule interview

---

## Troubleshooting

### Backend Issues

**Problem: "Cannot find module 'dotenv'"**
- **Solution**: Run `npm install` in the backend directory

**Problem: "DATABASE_URL not found in environment"**
- **Solution**: Create `.env` file in backend directory with valid `DATABASE_URL`

**Problem: "Port 3000 already in use"**
- **Solution**: Change `PORT` in `.env` or kill the process using port 3000

**Problem: "PostgreSQL connection refused"**
- **Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct

**Problem: "Prisma migrations failed"**
- **Solution**: Run `npx prisma migrate reset --force` (⚠️ This deletes all data)

### Frontend Issues

**Problem: "Cannot GET http://localhost:3000/..."**
- **Solution**: Ensure backend is running on correct port specified in config

**Problem: "Module not found" errors**
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`

**Problem: "Port 5173 already in use"**
- **Solution**: Vite will use the next available port automatically, or change in vite.config.js

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | Yes | PostgreSQL connection string | postgresql://user:pass@localhost:5432/prepsync |
| JWT_SECRET | Yes | Secret for JWT signing | your_jwt_secret_key |
| SESSION_SECRET | Yes | Secret for session encryption | your_session_secret |
| GEMINI_API_KEY | Yes | Google Generative AI key | AIza... |
| PORT | No | Server port (default: 3000) | 3000 |

---

## Development Workflow

1. **Start PostgreSQL** - Ensure database server is running
2. **Terminal 1 - Backend**: `cd backend && npm start`
3. **Terminal 2 - Frontend**: `cd frontend && npm run dev`
4. **Open Browser**: Navigate to `http://localhost:5173`
5. **Test API**: Use frontend or curl to test endpoints
6. **Check Logs**: Monitor both terminal windows for errors

---

## Production Deployment

### Backend Deployment Checklist
- [ ] Set all `.env` variables in production environment
- [ ] Use a strong `JWT_SECRET` and `SESSION_SECRET`
- [ ] Configure `DATABASE_URL` with production database
- [ ] Set `NODE_ENV=production`
- [ ] Use a process manager (PM2, systemd, etc.)
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS for production domain

### Frontend Deployment Checklist
- [ ] Update `API_URL` in config to production backend
- [ ] Run `npm run build` to create optimized build
- [ ] Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
- [ ] Set up environment variables for production domain

---

## Support & Documentation

- **Prisma Docs**: https://www.prisma.io/docs/
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Socket.io Docs**: https://socket.io/docs/
- **Google Generative AI**: https://ai.google.dev/

---

## License

ISC

---

## Notes

- The backend serves static files from `/uploads` directory for resume and recording access
- WebSocket connections require authentication tokens
- Interview recordings are stored in `backend/uploads/recordings/`
- Maximum file upload size: 500MB
- JWT tokens expire in 1 hour by default
