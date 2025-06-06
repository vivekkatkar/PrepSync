import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { checkEligibility } from '../services/aiInterviewService.js';

const router = express.Router();

router.get('/iseligible', authenticateToken, async (req, res) => {
  try {
    const result = await checkEligibility(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

export default router;
