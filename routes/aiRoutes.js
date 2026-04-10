import express from 'express';
import { getDashboardInsights } from '../controllers/aiController.js';
import { protect } from '../controllers/userController.js';

const router = express.Router();

router.get('/insights', protect, getDashboardInsights);

export default router;
