import express from 'express';
import { listActiveTemplates } from '../controllers/templateController.js';

const router = express.Router();

router.get('/', listActiveTemplates);

export default router;
