/**
 * Ad Space Marketplace API controller.
 * POST /api/adspaces, GET /api/adspaces, GET /api/adspaces/:id,
 * GET /api/adspaces/city/:city, DELETE /api/adspaces/:id
 */
import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { isFullyBooked } from '../scripts/automation.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const { AdSpace, User, Booking, Review, Notification } = models;
const uploadDir = path.join(process.cwd(), 'uploads', 'adspaces');
fs.mkdirSync(uploadDir, { recursive: true });

const checkIfVideo = (url) => {
  if (!url) return false;
  const s = String(url);
  // Matches typical video extensions anywhere in the path, or explicitly mentions video
  return s.match(/\.(mp4|webm|ogg|mov)/i) || s.toLowerCase().includes('video');
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const name = path.parse(file.originalname || 'upload').name.replace(/\s+/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${name}-${timestamp}${ext}`);
  },
});

/** Owner create/edit: up to 10 mixed image+video files under field name 'media'. */
export const uploadAdSpaceMedia = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image or video files are allowed.'));
    }
    cb(null, true);
  },
}).array('media', 10);

const today = () => new Date().toISOString().slice(0, 10);

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

/** Returns Map<adSpaceId, { hasActiveBooking, bookedUntil }> for given space objects */
async function getAvailabilityForSpaces(spaces) {
  if (!spaces.length) return {};
  const ids = spaces.map((s) => s.id);
  const activeBookings = await Booking.findAll({
    where: {
      adSpaceId: { [Op.in]: ids },
      status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      endDate: { [Op.gte]: today() },
    },
    raw: true,
  });

  const map = {};
  for (const s of spaces) {
    const spaceBookings = activeBookings.filter((b) => b.adSpaceId === s.id);
    if (!spaceBookings.length) {
      map[s.id] = { hasActiveBooking: false, bookedUntil: null };
      continue;
    }

    // Logic: Only mark as "Full" if there are no free dates left in the space's range.
    // If no available_to is set, we treat it as always available (never fully booked).
    if (!s.availableTo) {
      map[s.id] = { hasActiveBooking: false, bookedUntil: null };
      continue;
    }

    // Calculate total days in remaining available range
    const searchStart = today() > s.availableFrom ? today() : s.availableFrom;
    const searchEnd = s.availableTo;
    const totalDaysToFill = daysBetween(searchStart, searchEnd);

    // Sum up the number of booked days within that window
    let bookedDaysCount = 0;
    // Note: This is an approximation (doesn't handle overlaps perfectly, 
    // but bookings in this system are already prevented from overlapping).
    for (const b of spaceBookings) {
      const overlapStart = b.startDate > searchStart ? b.startDate : searchStart;
      const overlapEnd = b.endDate < searchEnd ? b.endDate : searchEnd;
      const duration = daysBetween(overlapStart, overlapEnd);
      if (duration > 0) bookedDaysCount += duration;
    }

    const isFullyBooked = bookedDaysCount >= totalDaysToFill;
    const maxEndDate = spaceBookings.reduce((max, b) => (b.endDate > max ? b.endDate : max), '');

    map[s.id] = {
      hasActiveBooking: isFullyBooked,
      bookedUntil: isFullyBooked ? maxEndDate : null,
    };
  }
  return map;
}

export async function create(req, res) {
  try {
    const ownerId = req.body.owner_id ?? req.body.ownerId ?? req.headers['x-user-id'];
    if (!ownerId) return res.status(400).json({ success: false, message: 'owner_id required.' });
    const {
      title,
      description,
      city,
      location,
      ad_type,
      adType,
      width,
      height,
      price_per_day,
      pricePerDay,
      price_per_second,
      pricePerSecond,
      image_url,
      imageUrl,
      video_url,
      videoUrl,
      availableFrom,
      availableTo,
      slotDuration,
      notes,
    } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required.' });

    const files = Array.isArray(req.files) ? req.files : [];
    const allUrls = files.map(f => `/uploads/adspaces/${f.filename}`);
    const imageFile = files.find(f => f.mimetype.startsWith('image/'));
    const videoFile = files.find(f => f.mimetype.startsWith('video/'));
    const uploadedImageUrl = imageFile ? `/uploads/adspaces/${imageFile.filename}` : null;
    const uploadedVideoUrl = videoFile ? `/uploads/adspaces/${videoFile.filename}` : null;

    const adTypeVal = ad_type ?? adType ?? null;

    const finalImageUrl = uploadedImageUrl
      || (image_url ? String(image_url).trim() : null)
      || (imageUrl ? String(imageUrl).trim() : null)
      || null;
    const finalVideoUrl = uploadedVideoUrl
      || (video_url ? String(video_url).trim() : null)
      || (videoUrl ? String(videoUrl).trim() : null)
      || null;

    const ppsRaw = price_per_second ?? pricePerSecond;
    const pricePerSecondNum = ppsRaw != null && ppsRaw !== '' ? Number(ppsRaw) : null;

    if (adTypeVal === 'digital_screen') {
      if (pricePerSecondNum == null || Number.isNaN(pricePerSecondNum) || pricePerSecondNum <= 0) {
        return res.status(400).json({ success: false, message: 'Valid price per second is required for digital screens.' });
      }
      if (!finalImageUrl && !finalVideoUrl) {
        return res.status(400).json({ success: false, message: 'Upload at least one image or video for digital screens.' });
      }
      const space = await AdSpace.create({
        ownerId: Number(ownerId),
        title,
        description: description ?? null,
        city: city ?? null,
        location: location ?? null,
        adType: adTypeVal,
        width: width != null ? Number(width) : null,
        height: height != null ? Number(height) : null,
        pricePerDay: (price_per_day != null || pricePerDay != null) ? Number(price_per_day ?? pricePerDay) : (pricePerSecondNum || 0),
        pricePerSecond: pricePerSecondNum,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        mediaUrls: allUrls,
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        slotDuration: slotDuration || null,
        notes: notes || null,
        verified: false,
        verificationStatus: 'pending',
      });

      // Notify admin
      try {
        await Notification.create({
          userId: 1, // Super admin
          title: 'New Ad Space for Verification',
          message: `A new ad space "${space.title}" has been submitted and is pending verification.`,
          type: 'system',
          link: '/admin/adspaces'
        });
      } catch (notifyErr) {
        console.error('Failed to notify admin of new ad space:', notifyErr);
      }

      return res.status(201).json({ success: true, data: space.toJSON() });
    }

    if (!finalImageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required.' });
    }
    const space = await AdSpace.create({
      ownerId: Number(ownerId),
      title,
      description: description ?? null,
      city: city ?? null,
      location: location ?? null,
      adType: adTypeVal,
      width: width != null ? Number(width) : null,
      height: height != null ? Number(height) : null,
      pricePerDay: price_per_day != null ? Number(price_per_day) : (pricePerDay != null ? Number(pricePerDay) : 0),
      pricePerSecond: null,
      imageUrl: finalImageUrl,
      videoUrl: finalVideoUrl,
      mediaUrls: allUrls,
      availableFrom: availableFrom || null,
      availableTo: availableTo || null,
      notes: notes || null,
      verified: false,
      verificationStatus: 'pending',
    });

    // Notify admin
    try {
      await Notification.create({
        userId: 1, // Super admin
        title: 'New Ad Space for Verification',
        message: `A new ad space "${space.title}" has been submitted and is pending verification.`,
        type: 'system',
        link: '/admin/adspaces'
      });
    } catch (notifyErr) {
      console.error('Failed to notify admin of new ad space:', notifyErr);
    }

    return res.status(201).json({ success: true, data: space.toJSON() });
  } catch (err) {
    console.error('AdSpace create error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function list(req, res) {
  try {
    const {
      city,
      ad_type,
      search,
      max_price,
      min_width,
      min_height,
      vendor_only,
    } = req.query;
    const where = {};
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (ad_type) where.adType = ad_type;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }
    if (max_price != null && max_price !== '') {
      const val = Number(max_price);
      if (!Number.isNaN(val) && val >= 0) where.pricePerDay = { [Op.lte]: val };
    }
    if (min_width != null && min_width !== '') {
      const val = Number(min_width);
      if (!Number.isNaN(val) && val >= 0) where.width = { [Op.gte]: val };
    }
    if (min_height != null && min_height !== '') {
      const val = Number(min_height);
      if (!Number.isNaN(val) && val >= 0) where.height = { [Op.gte]: val };
    }

    /** 
     * ENFORCED: Public marketplace and search results only show verified listings.
     * Exception: ownerId specific route (listByOwner) and Admin specific routes are handled separately.
     */
    const fragments = [];
    if (Object.keys(where).length > 0) fragments.push({ ...where });
    fragments.push({ verified: true });
    fragments.push({ isActive: true });

    // Public marketplace should only show listings with at least one media asset
    fragments.push({
      [Op.or]: [
        { imageUrl: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
        { videoUrl: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
      ],
    });
    
    where[Op.and] = fragments;

    const userInclude = {
      model: User,
      as: 'User',
      attributes: ['id', 'name', 'email'],
      required: true,
      where: { role: 'space_owner', isActive: true },
    };

    const spaces = await AdSpace.findAll({
      where,
      include: [userInclude],
      order: [[sequelize.col('AdSpace.created_at'), 'DESC']],
    });
    const availability = await getAvailabilityForSpaces(spaces);
    const data = spaces.map((s) => {
      const j = s.toJSON();
      const av = availability[j.id];
      j.hasActiveBooking = av?.hasActiveBooking ?? false;
      j.bookedUntil = av?.bookedUntil ?? null;
      return j;
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('AdSpace list error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id, {
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] }],
    });
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });

    // Restriction: Only verified and active ad spaces can be viewed by the public.
    // Inactive/Unverified spaces can only be viewed by their owner or an administrator.
    if (!space.verified || !space.isActive) {
      const requesterId = Number(req.headers['x-user-id'] || 0);
      if (space.ownerId !== requesterId) {
        // Check if requester is an admin
        const requester = await User.findByPk(requesterId);
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'This ad space is currently inactive or pending verification.' });
        }
      }
    }

    const availability = await getAvailabilityForSpaces([space]);
    const av = availability[space.id];
    const data = space.toJSON();
    data.hasActiveBooking = av?.hasActiveBooking ?? false;
    data.bookedUntil = av?.bookedUntil ?? null;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('AdSpace getById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listByCity(req, res) {
  try {
    const { city } = req.params;
    const spaces = await AdSpace.findAll({
      where: { 
        city: { [Op.like]: `%${city}%` },
        verified: true,
        isActive: true
      },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'], where: { isActive: true }, required: true }],
      order: [[sequelize.col('AdSpace.created_at'), 'DESC']],
    });
    return res.json({ success: true, data: spaces });
  } catch (err) {
    console.error('AdSpace listByCity error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** GET /api/adspaces/owner/:ownerId */
export async function listByOwner(req, res) {
  try {
    const { ownerId } = req.params;
    const spaces = await AdSpace.findAll({
      where: { ownerId: Number(ownerId) },
      order: [[sequelize.col('AdSpace.created_at'), 'DESC']],
    });
    const availability = await getAvailabilityForSpaces(spaces);
    const data = spaces.map((s) => {
      const j = s.toJSON();
      const av = availability[j.id];
      j.hasActiveBooking = av?.hasActiveBooking ?? false;
      j.bookedUntil = av?.bookedUntil ?? null;
      return j;
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('AdSpace listByOwner error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/adspaces/:id */
export async function update(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    const {
      title,
      description,
      city,
      location,
      ad_type,
      adType,
      width,
      height,
      price_per_day,
      pricePerDay,
      price_per_second,
      pricePerSecond,
      image_url,
      imageUrl,
      video_url,
      videoUrl,
      availableFrom,
      availableTo,
      slotDuration,
      notes,
    } = req.body;
    if (title != null) space.title = title;
    if (description != null) space.description = description;
    if (city != null) space.city = city;
    if (location != null) space.location = location;
    if (ad_type != null || adType != null) space.adType = ad_type ?? adType;
    if (width != null) space.width = Number(width);
    if (height != null) space.height = Number(height);
    if (price_per_day != null || pricePerDay != null) space.pricePerDay = Number(price_per_day ?? pricePerDay);
    if (price_per_second !== undefined || pricePerSecond !== undefined) {
      const v = price_per_second ?? pricePerSecond;
      space.pricePerSecond = v === '' || v == null ? null : Number(v);
    }
    
    if (availableFrom !== undefined) space.availableFrom = availableFrom || null;
    if (availableTo !== undefined) space.availableTo = availableTo || null;
    if (slotDuration !== undefined) space.slotDuration = slotDuration || null;
    if (notes !== undefined) space.notes = notes || null;
    if (image_url != null || imageUrl != null) space.imageUrl = image_url ?? imageUrl;
    if (video_url != null || videoUrl != null) space.videoUrl = video_url ?? videoUrl;

    // Handle existing media URLs passed from frontend (to support deletions)
    const { existingMediaUrls } = req.body;
    let finalUrls = Array.isArray(space.mediaUrls) ? [...space.mediaUrls] : [];

    if (existingMediaUrls !== undefined) {
      try {
        const parsed = typeof existingMediaUrls === 'string' ? JSON.parse(existingMediaUrls) : existingMediaUrls;
        if (Array.isArray(parsed)) {
          finalUrls = parsed;
        }
      } catch (e) {
        console.error('Error parsing existingMediaUrls:', e);
      }
    }

    // Append any newly uploaded files
    const newFiles = Array.isArray(req.files) ? req.files : [];

    const adTypeVal = ad_type ?? adType ?? space.adType;

    if (newFiles.length > 0) {
      const newUrls = newFiles.map(f => `/uploads/adspaces/${f.filename}`);
      finalUrls = [...finalUrls, ...newUrls];
    }

    // Update the model field
    space.mediaUrls = finalUrls;
    // Force sequelize to see the change if array mutation detection fails
    space.changed('mediaUrls', true);

    // Refresh primary thumbnail fields (imageUrl/videoUrl) from the finalized mediaUrls list
    if (Array.isArray(space.mediaUrls) && space.mediaUrls.length > 0) {
      const firstImage = space.mediaUrls.find(url => !checkIfVideo(url));
      const firstVideo = space.mediaUrls.find(url => checkIfVideo(url));
      
      // ALWAYS prioritize the first image in the ACTUAL list as the primary thumbnail
      // This ensures that if the user deletes the old primary or adds a new one, the card updates correctly.
      space.imageUrl = firstImage || space.mediaUrls[0];
      space.videoUrl = firstVideo || null;
    } else {
      space.imageUrl = null;
      space.videoUrl = null;
    }

    await space.save();
    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('AdSpace update error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    await space.destroy();
    return res.json({ success: true, message: 'Ad space deleted.' });
  } catch (err) {
    console.error('AdSpace remove error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
/** PUT /api/adspaces/:id/active — owner toggle active status */
export async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const requesterId = Number(req.headers['x-user-id'] || 0);

    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });

    // Authorization: only the owner can toggle their own space (Admins have their own endpoint)
    if (space.ownerId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this ad space.' });
    }

    // STRICT: If deactivated by admin, owner CANNOT reactivate
    if (isActive && space.adminDeactivated) {
      return res.status(403).json({ success: false, message: 'This listing was deactivated by an administrator. You must request reactivation instead of toggling it back.' });
    }

    // NEW: Prevent reactivation if date is expired or fully booked
    const todayStr = new Date().toISOString().slice(0, 10);
    if (isActive) {
      if (space.availableTo && space.availableTo < todayStr) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot activate an expired listing. Please update the "Available To" (Ending On) date to a future date first.' 
        });
      }
      
      const isFull = await isFullyBooked('space', id);
      if (isFull) {
        return res.status(400).json({
          success: false,
          message: 'This listing is completely filled for its availability period. Please update the "Available To" date or remove existing bookings before activating.'
        });
      }
    }

    if (typeof isActive === 'boolean') {
      space.isActive = isActive;
      // If the owner manually activates it, clear the adminDeactivated flag
      if (isActive) {
        space.adminDeactivated = false;
      }
      await space.save();
    }
    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('toggleActive error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/adspaces/:id/request-reactivation — owner request activation after admin disable */
export async function requestReactivation(req, res) {
  try {
    const { id } = req.params;
    const requesterId = Number(req.headers['x-user-id'] || 0);

    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });

    if (space.ownerId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (!space.adminDeactivated) {
      return res.status(400).json({ success: false, message: 'This listing is not deactivated by an administrator.' });
    }

    space.reactivationRequested = true;
    await space.save();

    // Notify ALL admins
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        title: 'Reactivation Request',
        message: `Vendor "${req.headers['x-user-name'] || 'Owner'}" has requested reactivation for ad space "${space.title}".`,
        type: 'system',
        link: '/admin/adspaces'
      });
    }

    return res.json({ success: true, message: 'Reactivation request sent to administrators.' });
  } catch (err) {
    console.error('requestReactivation error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
export const resubmitVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });

    space.verificationStatus = 'pending';
    space.rejectionReason = null;
    await space.save();

    // Notify admin
    try {
      await Notification.create({
        userId: 1, // Super admin
        title: 'Ad Space Re-submitted',
        message: `An ad space "${space.title}" has been re-submitted for verification.`,
        type: 'system',
        link: '/admin/adspaces'
      });
    } catch (notifyErr) {
      console.error('Failed to notify admin of re-submission:', notifyErr);
    }

    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('resubmitVerification error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
