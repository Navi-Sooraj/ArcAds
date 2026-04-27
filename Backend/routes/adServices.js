import express from 'express';
import { upload } from '../middleware/upload.js';
import {
  listAdServices,
  createAdService,
  updateAdService,
  listAdServiceOptions,
  upsertAdServiceOption,
  deleteAdServiceOption,
  deleteAdService,
  toggleAdServiceActive,
} from '../controllers/adServiceController.js';

const router = express.Router();

router.get('/', listAdServices);
router.post('/', upload.array('images', 12), createAdService);
router.put('/:id', upload.array('images', 12), updateAdService);
router.put('/:id/active', toggleAdServiceActive);
router.delete('/:id', deleteAdService);
router.get('/options', listAdServiceOptions);
router.post('/options', upsertAdServiceOption);
router.delete('/options', deleteAdServiceOption);

export default router;
