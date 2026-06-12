import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import { parsePdf } from './parser.js';
import { analyzeProfile, generateQuestion, evaluateAnswer, generateFinalReport } from './gemini.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Middleware
app.use('/api/', apiLimiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));



/**
 * Route: GET /api/config
 * Exposes configuration status to the frontend.
 */
app.get('/api/config', (req, res) => {
  res.status(200).json({
    isGeminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
  });
});

// Configure Multer for file upload in memory with PDF constraint
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * Route: POST /api/analyze
 * Uploads a resume PDF, extracts text, extracts job description text,
 * and calls Gemini to build the Candidate Profile.
 */
app.post('/api/analyze', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || '';
    const targetRole = req.body.targetRole || 'Full Stack';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No resume PDF file uploaded' });
    }
    if (!jobDescription.trim()) {
      return res.status(400).json({ error: 'Job Description is required' });
    }

    console.log(`Starting parsing for file: ${file.originalname}...`);
    const resumeText = await parsePdf(file.buffer);

    console.log('Sending text to Gemini for profile analysis...');
    const profile = await analyzeProfile(resumeText, jobDescription, targetRole);

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({ error: error.message || 'Profile analysis failed' });
  }
});

/**
 * Route: POST /api/next-question
 * Generates the next question text dynamically.
 */
app.post('/api/next-question', async (req, res) => {
  try {
    const { profile, history, questionNumber } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }
    if (questionNumber === undefined) {
      return res.status(400).json({ error: 'Question number is required' });
    }

    console.log(`Generating question ${questionNumber}...`);
    const question = await generateQuestion(profile, history || [], questionNumber);

    return res.status(200).json({ question });
  } catch (error) {
    console.error('Error in /api/next-question:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate question' });
  }
});

/**
 * Route: POST /api/submit-answer
 * Evaluates candidate response to a question and scores it.
 */
app.post('/api/submit-answer', async (req, res) => {
  try {
    const { question, answer, profile } = req.body;

    if (!question || !answer || !profile) {
      return res.status(400).json({ error: 'Missing question, answer, or profile context' });
    }

    console.log('Evaluating answer...');
    const evaluation = await evaluateAnswer(question, answer, profile);

    return res.status(200).json({ evaluation });
  } catch (error) {
    console.error('Error in /api/submit-answer:', error);
    return res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
});

/**
 * Route: POST /api/generate-report
 * Generates final performance report.
 */
app.post('/api/generate-report', async (req, res) => {
  try {
    const { profile, history } = req.body;

    if (!profile || !history) {
      return res.status(400).json({ error: 'Missing profile or history' });
    }

    console.log('Generating final report...');
    const report = await generateFinalReport(profile, history);

    return res.status(200).json(report);
  } catch (error) {
    console.error('Error in /api/generate-report:', error);
    return res.status(500).json({ error: error.message || 'Report generation failed' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve client built static assets
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA router on non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port http://localhost:${PORT}`);
});
