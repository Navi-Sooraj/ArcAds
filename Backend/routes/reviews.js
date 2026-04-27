/**
 * Review routes.
 */
import express from 'express';
import { create, listByAdSpace } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', create);
router.get('/ad-space/:adSpaceId', listByAdSpace);

export default router;
