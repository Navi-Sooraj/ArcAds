import { Router } from 'express';
import { getLandingStats } from '../controllers/publicStatsController.js';

const router = Router();

router.get('/landing-stats', getLandingStats);

export default router;
