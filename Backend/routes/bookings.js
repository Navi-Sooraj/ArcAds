/**
 * Booking routes.
 */
import express from 'express';
import {
  create,
  list,
  getById,
  updateStatus,
  listByUser,
  listByOwner,
  listOccupiedForSpace,
  approve,
  reject,
  uploadCreative,
  uploadBookingCreative,
  resubmitBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { getOccupiedDates } from '../controllers/adServiceInquiryController.js';

const router = express.Router();

router.post('/', create);
router.post('/upload-creative', uploadBookingCreative, uploadCreative);
router.get('/space/:adSpaceId/occupied', listOccupiedForSpace);
router.get('/service/:serviceId/occupied', getOccupiedDates);
router.get('/', list);
router.get('/user/:userId', listByUser);
router.get('/owner/:ownerId', listByOwner);
router.get('/:id', getById);
router.patch('/:id/status', updateStatus);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/resubmit', uploadBookingCreative, resubmitBooking);
router.put('/:id/approve', approve);
router.put('/:id/reject', reject);

export default router;
