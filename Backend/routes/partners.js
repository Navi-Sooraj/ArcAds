/**
 * Partner listing routes (space owners and their spaces).
 */
import express from 'express';
import { listPartners, partnerSpaces } from '../controllers/partnerController.js';

const router = express.Router();

router.get('/', listPartners);
router.get('/:ownerId/spaces', partnerSpaces);

export default router;
