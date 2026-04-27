import express from 'express';
import { generateAdContent, generateAdImage } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-ad', generateAdContent);
router.post('/generate-image', generateAdImage);

export default router;
