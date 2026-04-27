/**
 * Notification routes.
 */
import express from 'express';
import { list, markRead, remove, markAllRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', list);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
router.delete('/:id', remove);

export default router;
