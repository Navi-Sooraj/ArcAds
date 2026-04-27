/**
 * Booking controller.
 * Create, list, update status of bookings.
 * Create booking requires payment (dummy card validation).
 */
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import models from '../models/index.js';
import { Op } from 'sequelize';
import { checkAndHandleFullness } from '../scripts/automation.js';

const { Booking, AdSpace, User, Notification, Payment } = models;

const bookingUploadDir = path.join(process.cwd(), 'uploads', 'bookings');
fs.mkdirSync(bookingUploadDir, { recursive: true });

const bookingVideoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bookingUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadBookingCreative = multer({
  storage: bookingVideoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || (!file.mimetype.startsWith('video/') && !file.mimetype.startsWith('image/'))) {
      return cb(new Error('File must be a video or an image.'));
    }
    cb(null, true);
  },
}).single('media');

export async function uploadCreative(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Media file (photo or video) required.' });
    }
    const url = `/uploads/bookings/${req.file.filename}`;
    return res.json({ success: true, data: { url } });
  } catch (err) {
    console.error('Booking creative upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function isDigitalScreenPerSecond(space) {
  return space?.adType === 'digital_screen' && Number(space.pricePerSecond) > 0;
}

/** Dummy payment validation. Returns { valid: boolean, message?: string, last4?: string } */
function validatePayment(payment, expectedAmount) {
  if (!payment || typeof payment !== 'object') {
    return { valid: false, message: 'Payment details are required.' };
  }
  const cardNumber = String(payment.cardNumber || '').replace(/\s/g, '');
  if (!/^\d{12,19}$/.test(cardNumber)) {
    return { valid: false, message: 'Card number must be 12–19 digits.' };
  }
  const expiryMonth = parseInt(payment.expiryMonth, 10);
  const expiryYear = parseInt(payment.expiryYear, 10);
  const year = expiryYear < 100 ? 2000 + expiryYear : expiryYear;
  if (expiryMonth < 1 || expiryMonth > 12) {
    return { valid: false, message: 'Invalid expiry month (01–12).' };
  }
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && expiryMonth < now.getMonth() + 1)) {
    return { valid: false, message: 'Card has expired.' };
  }
  const cvv = String(payment.cvv || '').trim();
  if (!/^\d{3,4}$/.test(cvv)) {
    return { valid: false, message: 'CVV must be 3 or 4 digits.' };
  }
  const cardHolderName = String(payment.cardHolderName || '').trim();
  if (cardHolderName.length < 2) {
    return { valid: false, message: 'Card holder name is required (min 2 characters).' };
  }
  const amount = Number(payment.amount);
  if (Number.isNaN(amount) || Math.abs(amount - expectedAmount) > 0.01) {
    return { valid: false, message: 'Payment amount does not match booking total.' };
  }
  const last4 = cardNumber.slice(-4);
  return { valid: true, last4 };
}

/** Generate dummy transaction id */
function dummyTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

export async function create(req, res) {
  try {
    const advertiserId = req.body.advertiserId || req.headers['x-user-id'];
    const {
      adSpaceId,
      startDate,
      endDate,
      notes,
      title,
      description,
      payment,
      totalSeconds: bodyTotalSeconds,
      creativeUrl: bodyCreativeUrl,
    } = req.body;
    if (!advertiserId || !adSpaceId || !startDate || !endDate || !title) {
      return res.status(400).json({ success: false, message: 'advertiserId, adSpaceId, startDate, endDate, and title are required.' });
    }
    const space = await AdSpace.findByPk(adSpaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    const days = daysBetween(startDate, endDate);
    if (days < 1) return res.status(400).json({ success: false, message: 'Invalid date range.' });

    const isDigital = isDigitalScreenPerSecond(space);
    let totalAmount;
    let totalSeconds = null;
    let creativeUrl = String(bodyCreativeUrl || '').trim();

    if (!creativeUrl) {
      return res.status(400).json({ success: false, message: 'Media creative is required for all bookings.' });
    }

    totalAmount = Math.round(Number(space.pricePerDay || 0) * days * 100) / 100;
    totalSeconds = null;

    let finalTransactionId = dummyTransactionId();
    let paymentMethod = 'card';
    let cardLast4 = null;

    if (req.body.paymentMethod === 'upi') {
      paymentMethod = 'upi';
      finalTransactionId = req.body.transactionId || '';
      if (!finalTransactionId) {
        return res.status(400).json({ success: false, message: 'Transaction ID (UTR) is required for UPI payments.' });
      }
      // Duplicate check
      const existingPayment = await Payment.findOne({
        where: { transactionId: finalTransactionId, status: { [Op.ne]: 'failed' } }
      });
      if (existingPayment) {
        return res.status(400).json({ success: false, message: 'This Transaction ID (UTR) has already been used.' });
      }
    } else {
      const paymentValidation = validatePayment(payment, totalAmount);
      if (!paymentValidation.valid) {
        return res.status(400).json({ success: false, message: paymentValidation.message });
      }
      cardLast4 = paymentValidation.last4;
    }

    const conflicting = await Booking.findOne({
      where: {
        adSpaceId,
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
      },
    });
    if (conflicting) {
      return res.status(400).json({ success: false, message: 'Dates overlap with an existing booking.' });
    }

    const booking = await Booking.create({
      advertiserId: Number(advertiserId),
      adSpaceId: Number(adSpaceId),
      startDate,
      endDate,
      totalAmount,
      status: 'pending',
      title: title.trim(),
      description: description || null,
      notes: notes || null,
      totalSeconds,
      creativeUrl,
    });

    try {
      await Payment.create({
        bookingId: booking.id,
        amount: totalAmount,
        currency: 'INR',
        status: paymentMethod === 'upi' ? 'pending' : 'success',
        paymentMethod,
        cardLast4,
        transactionId: finalTransactionId,
      });
    } catch (paymentErr) {
      console.error('Payment create failed (booking still created):', paymentErr.message);
      // Booking is already created; return success so user can complete booking
    }

    if (space.ownerId) {
      await Notification.create({
        userId: space.ownerId,
        title: 'New booking request',
        message: `A new booking request for "${space.title}" (${startDate} – ${endDate}). Payment received.`,
        type: 'booking',
        link: `/owner`,
      });
    }
    const withAssociations = await Booking.findByPk(booking.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
        { model: AdSpace, as: 'AdSpace', include: [{ model: User, as: 'User', attributes: ['id', 'name'] }] },
        { model: Payment, as: 'Payments', attributes: ['id', 'amount', 'status', 'cardLast4', 'transactionId'] },
      ],
    });

    // Handle automated deactivation if full
    await checkAndHandleFullness('space', Number(adSpaceId));

    return res.status(201).json({ success: true, data: withAssociations });
  } catch (err) {
    console.error('Booking create error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function cleanUpExpiredPendingBookings(adSpaceId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expired = await Booking.findAll({
      where: {
        adSpaceId,
        status: 'pending',
        startDate: { [Op.lt]: today },
      },
    });
    for (const b of expired) {
      b.status = 'rejected';
      await b.save();
      // Notify advertiser
      await Notification.create({
        userId: b.advertiserId,
        title: 'Booking automatically rejected',
        message: `Your booking for ad space ID ${adSpaceId} was automatically rejected as it was not confirmed before the start date. Payment will be refunded within 24hr or 7 working days.`,
        type: 'booking',
        link: `/advertiser/bookings`,
      });
    }
  } catch (err) {
    console.error('cleanUpExpiredPendingBookings error:', err);
  }
}

function toYMD(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

/** GET /bookings/space/:adSpaceId/occupied — date ranges already held (pending/confirmed). */
export async function listOccupiedForSpace(req, res) {
  try {
    const adSpaceId = Number(req.params.adSpaceId);
    if (!Number.isFinite(adSpaceId) || adSpaceId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid ad space id.' });
    }
    // Perform cleanup for this space
    await cleanUpExpiredPendingBookings(adSpaceId);

    const rows = await Booking.findAll({
      where: {
        adSpaceId,
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      },
      attributes: ['startDate', 'endDate', 'status'],
      raw: true,
    });
    const data = rows.map((r) => ({
      startDate: toYMD(r.startDate),
      endDate: toYMD(r.endDate),
      status: r.status,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error('listOccupiedForSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function list(req, res) {
  try {
    const { userId, role, adSpaceId, status } = req.query;
    const options = {
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
        { model: AdSpace, as: 'AdSpace', include: [{ model: User, as: 'User', attributes: ['id', 'name'] }] },
      ],
      order: [['createdAt', 'DESC']],
    };
    const where = {};
    if (adSpaceId) where.adSpaceId = Number(adSpaceId);
    if (status) where.status = status;
    if (userId) {
      if (role === 'space_owner') {
        options.include[1].where = { ownerId: Number(userId) };
        options.include[1].required = true;
      } else {
        where.advertiserId = Number(userId);
      }
    }
    if (Object.keys(where).length) options.where = where;

    const bookings = await Booking.findAll(options);
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Booking list error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] },
        { model: AdSpace, as: 'AdSpace', include: [{ model: User, as: 'User', attributes: ['id', 'name', 'phone'] }] },
        { model: Payment, as: 'Payments', attributes: ['id', 'amount', 'status', 'cardLast4', 'transactionId'], required: false },
      ],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('Booking getById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.status = status;
    await booking.save();
    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('Booking updateStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** GET /api/bookings/user/:userId — bookings by advertiser (user_id) */
export async function listByUser(req, res) {
  try {
    const { userId } = req.params;
    const bookings = await Booking.findAll({
      where: { advertiserId: Number(userId) },
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
        { model: AdSpace, as: 'AdSpace', attributes: ['id', 'title', 'city', 'location', 'pricePerDay', 'imageUrl'] },
        { model: Payment, as: 'Payments', attributes: ['id', 'status', 'paymentMethod', 'cardLast4', 'transactionId'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Booking listByUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** GET /api/bookings/owner/:ownerId — bookings for spaces owned by ownerId */
export async function listByOwner(req, res) {
  try {
    const { ownerId } = req.params;
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
        {
          model: AdSpace,
          as: 'AdSpace',
          where: { ownerId: Number(ownerId) },
          required: true,
          attributes: ['id', 'title', 'city', 'location', 'pricePerDay', 'adType', 'pricePerSecond'],
        },
        { model: Payment, as: 'Payments', attributes: ['id', 'status', 'paymentMethod', 'cardLast4', 'transactionId'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Booking listByOwner error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/bookings/:id/approve — set status to confirmed (approved) */
export async function approve(req, res) {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: AdSpace, as: 'AdSpace', attributes: ['title'] }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.status = 'confirmed';
    await booking.save();
    await Notification.create({
      userId: booking.advertiserId,
      title: 'Booking approved',
      message: `Your booking for "${booking.AdSpace?.title}" (${booking.startDate} – ${booking.endDate}) has been approved.`,
      type: 'booking',
      link: `/advertiser/bookings`,
    });

    // Handle automated deactivation if full
    await checkAndHandleFullness('space', booking.adSpaceId);

    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('Booking approve error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/bookings/:id/reject — set status to rejected */
export async function reject(req, res) {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: AdSpace, as: 'AdSpace', attributes: ['title'] }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.status = 'rejected';
    await booking.save();
    await Notification.create({
      userId: booking.advertiserId,
      title: 'Booking rejected',
      message: `Your booking for "${booking.AdSpace?.title}" (${booking.startDate} – ${booking.endDate}) was declined by the space owner. Booking rejected and payment will be refunded within 24hr or 7 working days.`,
      type: 'booking',
      link: `/advertiser/bookings`,
    });
    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('Booking reject error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function resubmitBooking(req, res) {
  try {
    const { id } = req.params;
    const { utr } = req.body;
    
    const booking = await Booking.findByPk(id, {
      include: [{ model: AdSpace, as: 'AdSpace', attributes: ['title'] }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected bookings can be re-submitted.' });
    }

    // Update creative if provided
    if (req.file) {
      booking.creativeUrl = `/uploads/bookings/${req.file.filename}`;
    }

    booking.status = 'pending';
    await booking.save();

    // Update payment UTR if it's a UPI payment
    const payment = await Payment.findOne({ where: { bookingId: id } });
    if (payment) {
      if (utr) payment.transactionId = utr;
      payment.status = 'pending';
      await payment.save();
    }

    // Notify admins
    await Notification.create({
      userId: 1, // Admin
      title: 'Booking Re-submission',
      message: `A rejected booking for "${booking.AdSpace?.title}" has been re-submitted.`,
      type: 'booking',
      link: '/admin/bookings',
    });

    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('resubmitBooking error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}


export async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const userId = Number(req.headers['x-user-id'] || 0);

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.advertiserId !== userId) {
      return res.status(403).json({ success: false, message: `Unauthorized. Booking advertiser is ${booking.advertiserId}, but you are ${userId}.` });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
