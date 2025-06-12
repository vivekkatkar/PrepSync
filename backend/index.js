import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import session from "express-session";
import http from "http";
import multer from "multer";
import { Server } from "socket.io";
import fs from "fs";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import aiInterviewRoutes from "./routes/aiInterviewRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";

import { initializeAiInterviewWebSocket } from './services/aiInterviewWebSocketServer.js';
import { initializePeerInterviewWebSocket } from './services/peerInterviewWebSocketServer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(process.cwd(), 'uploads');
const recordingsDir = path.join(uploadsDir, 'recordings');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

app.use(cors({
  origin: true,   
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/services/ai-interview", aiInterviewRoutes);
app.use("/interviews", interviewRoutes);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads/recordings'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

app.post('/upload-recording', upload.single('recording'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No recording file provided' });
    }

    console.log('Recording uploaded:', req.file.filename);
    
    res.status(200).json({ 
      message: 'Recording uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/recordings/${req.file.filename}`,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload recording' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  if (error.message === 'Only video files are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mockmate.vivek-katkar.site'  
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

initializeAiInterviewWebSocket(server);
initializePeerInterviewWebSocket(io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, 'Reason:', reason);
  });
});

app.get(/^\/(?!auth|user|services|interviews|upload-recording|uploads|health).*/, (req, res) => {
  const indexFile = path.join(__dirname, 'client/build', 'index.html');
  
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).json({ 
      message: 'Server is running',
      note: 'Frontend build not found. This is normal during development.'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🎥 Recordings directory: ${recordingsDir}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;