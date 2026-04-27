/**
 * Admin routes: dashboard, users, ad spaces, bookings, delete, verify.
 */
import express from 'express';
import {
  dashboard,
  listUsers,
  updateUser,
  approveAdSpace,
  rejectAdSpace,
  listPendingSpaces,
  listAllBookings,
  listAdSpaces,
  createAdSpace,
  verifyAdSpace,
  toggleAdSpaceActive,
  toggleAdServiceActive,
  deleteUser,
  deleteAdSpace,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/pending-spaces', listPendingSpaces);
router.get('/adspaces', listAdSpaces);
router.post('/adspaces', createAdSpace);
router.post('/spaces/:id/approve', approveAdSpace);
router.put('/adspaces/:id/reject', rejectAdSpace);
router.put('/adspaces/:id/verify', verifyAdSpace);
router.put('/adspaces/:id/active', toggleAdSpaceActive);
router.put('/adservices/:id/active', toggleAdServiceActive);
router.delete('/adspaces/:id', deleteAdSpace);
router.get('/bookings', listAllBookings);
router.get('/templates', listTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
