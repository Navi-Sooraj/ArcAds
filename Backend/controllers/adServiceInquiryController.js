import models from '../models/index.js';
import { Op } from 'sequelize';
import { checkAndHandleFullness } from '../scripts/automation.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const { AdServiceInquiry, Notification, User } = models;

const uploadDir = path.join(process.cwd(), 'uploads', 'inquiries');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadInquiryMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = /image|video/i;
    if (!file.mimetype || !allowed.test(file.mimetype)) {
      return cb(new Error('Only images and videos are allowed.'));
    }
    cb(null, true);
  },
}).single('media');

export async function createInquiry(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }

    let { serviceId, serviceTitle, formData, totalAmount, status } = req.body;

    // Handle stringified JSON from FormData
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        // ignore
      }
    }

    if (!serviceId || !formData) {
      return res.status(400).json({ success: false, message: 'serviceId and formData are required.' });
    }

    // Attach uploaded file path to formData if present
    if (req.file) {
      formData.mediaUrl = `/uploads/inquiries/${req.file.filename}`;
      formData.mediaName = req.file.originalname;
    }

    const inquiry = await AdServiceInquiry.create({
      userId: Number(userId),
      serviceId: String(serviceId),
      serviceTitle: serviceTitle || null,
      formData,
      totalAmount: totalAmount ? Number(totalAmount) : null,
      status: status || 'pending',
    });

    // Notify admins
    await Notification.create({
      userId: 1,
      title: status === 'confirmed' ? 'New Ad Service Booking' : 'New Ad Service Inquiry',
      message: `A new ${status === 'confirmed' ? 'booking' : 'inquiry'} has been submitted for ${serviceTitle || serviceId}.`,
      type: 'booking',
      link: '/admin/ad-center',
    });

    // Handle automated deactivation if full
    await checkAndHandleFullness('service', String(serviceId));

    return res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    console.error('AdServiceInquiry create error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function getOccupiedDates(req, res) {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required.' });
    }

    // Fetch all pending or confirmed inquiries for this service
    const inquiries = await AdServiceInquiry.findAll({
      where: {
        serviceId: String(serviceId),
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      },
      attributes: ['formData', 'status'],
      raw: true,
    });

    const occupiedRanges = [];

    for (const inquiry of inquiries) {
      const form = typeof inquiry.formData === 'string' ? JSON.parse(inquiry.formData) : (inquiry.formData || {});
      const resStatus = inquiry.status || 'pending';

      const s = form.startDate || form.start_date || form.start || form.eventDate || form.date || (Array.isArray(form.dateRange) ? form.dateRange[0] : null);
      const e = form.endDate || form.end_date || form.end || form.eventDate || form.date || (Array.isArray(form.dateRange) ? (form.dateRange[1] || form.dateRange[0]) : null);

      if (s && e) {
        occupiedRanges.push({ startDate: String(s), endDate: String(e), status: resStatus });
      }
    }

    return res.json({ success: true, data: occupiedRanges });
  } catch (err) {
    console.error('getOccupiedDates error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listInquiries(req, res) {
  try {
    const { userId } = req.query;
    const where = {};
    if (userId) where.userId = Number(userId);

    const inquiries = await AdServiceInquiry.findAll({
      where,
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: inquiries });
  } catch (err) {
    console.error('listInquiries error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function updateInquiryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const inquiry = await AdServiceInquiry.findByPk(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    inquiry.status = status;
    await inquiry.save();

    // Notify advertiser
    let title = '';
    let message = '';
    
    if (status === 'confirmed') {
      title = 'Slot Confirmation';
      message = `Slot Confirmation: Your booking for "${inquiry.serviceTitle || inquiry.serviceId}" has been accepted.`;
    } else if (status === 'rejected') {
      title = 'Booking Declined';
      message = `Booking Declined: Your booking for "${inquiry.serviceTitle || inquiry.serviceId}" was rejected. The payment will be refunded fully before 7 working days.`;
    }

    if (title && message) {
      await Notification.create({
        userId: inquiry.userId,
        title,
        message,
        type: 'booking',
        link: '/advertiser/dashboard',
      });
    }
    
    // Handle automated deactivation if full
    await checkAndHandleFullness('service', String(inquiry.serviceId));

    return res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('updateInquiryStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function resubmitInquiry(req, res) {
  try {
    const { id } = req.params;
    const { utr } = req.body;
    
    const inquiry = await AdServiceInquiry.findByPk(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    if (inquiry.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected inquiries can be re-submitted.' });
    }

    const updatedFormData = { ...inquiry.formData };
    if (utr) updatedFormData.upiId = utr;
    
    if (req.file) {
      updatedFormData.mediaUrl = `/uploads/inquiries/${req.file.filename}`;
      updatedFormData.mediaName = req.file.originalname;
    }

    inquiry.formData = updatedFormData;
    inquiry.status = 'pending';
    inquiry.isResubmitted = true;
    await inquiry.save();

    // Notify admins
    await Notification.create({
      userId: 1,
      title: 'Ad Service Re-submission',
      message: `A rejected inquiry for ${inquiry.serviceTitle || inquiry.serviceId} has been re-submitted.`,
      type: 'booking',
      link: '/admin/ad-center',
    });

    return res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('resubmitInquiry error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function cancelInquiry(req, res) {
  try {
    const { id } = req.params;
    const userId = Number(req.headers['x-user-id'] || 0);

    const inquiry = await AdServiceInquiry.findByPk(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    if (inquiry.userId !== userId) {
      return res.status(403).json({ success: false, message: `Unauthorized. Inquiry owner is ${inquiry.userId}, but you are ${userId}.` });
    }

    if (inquiry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending inquiries can be cancelled.' });
    }

    inquiry.status = 'cancelled';
    await inquiry.save();

    return res.json({ success: true, message: 'Inquiry cancelled successfully.' });
  } catch (err) {
    console.error('cancelInquiry error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
