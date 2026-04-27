import express from 'express';
import { createInquiry, uploadInquiryMedia, listInquiries, updateInquiryStatus, resubmitInquiry, cancelInquiry } from '../controllers/adServiceInquiryController.js';

const router = express.Router();

router.post('/', uploadInquiryMedia, createInquiry);
router.get('/', listInquiries);
router.patch('/:id/status', updateInquiryStatus);
router.patch('/:id/cancel', cancelInquiry);
router.patch('/:id/resubmit', uploadInquiryMedia, resubmitInquiry);

export default router;
