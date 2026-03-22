import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendMonthlyReport } from '../jobs/monthEndReport';

const router = express.Router();

// POST /api/email/test-report — Manual trigger for testing
router.post('/test-report', authenticate, async (req: AuthRequest, res) => {
  await sendMonthlyReport(req.userId!);
  res.json({ message: 'Monthly report sent successfully' });
});

export default router;
