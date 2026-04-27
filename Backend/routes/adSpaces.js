/**
 * Ad Space Marketplace routes.
 * GET /api/adspaces/city/:city must be before GET /api/adspaces/:id
 */
import express from 'express';
import {
  create,
  list,
  getById,
  listByCity,
  listByOwner,
  update,
  remove,
  uploadAdSpaceMedia,
  toggleActive,
  requestReactivation,
  resubmitVerification,
} from '../controllers/adspacesController.js';

const router = express.Router();

router.post('/', uploadAdSpaceMedia, create);
router.get('/', list);
router.get('/city/:city', listByCity);
router.get('/owner/:ownerId', listByOwner);
router.get('/:id', getById);
router.put('/:id', uploadAdSpaceMedia, update);
router.put('/:id/active', toggleActive);
router.put('/:id/request-reactivation', requestReactivation);
router.put('/:id/resubmit-verification', resubmitVerification);
router.delete('/:id', remove);

export default router;
