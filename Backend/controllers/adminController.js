/**
 * Admin controller.
 * User management, approve ad spaces, bookings overview, notifications.
 */
import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';

const { User, AdSpace, Booking, Review, Notification, AdTemplate, AdService, AdServiceInquiry } = models;

export async function dashboard(req, res) {
  try {
    const [
      adServicesCount,
      advertisersCount,
      verifiedVendorsCount,
      pendingVendorsCount,
      verifiedAdSpacesCount,
      pendingAdSpacesCount,
      confirmedBookingsCount,
      pendingBookingsCount,
      recentInquiries,
      confirmedAdServiceBookingsCount,
      pendingAdServiceBookingsCount
    ] = await Promise.all([
      AdService.count(),
      User.count({ where: { role: 'advertiser' } }),
      User.count({ where: { role: 'space_owner', isActive: true } }),
      User.count({ where: { role: 'space_owner', isActive: false } }),
      AdSpace.count({ where: { verified: true } }),
      AdSpace.count({ where: { verified: false } }),
      Booking.count({ where: { status: { [Op.in]: ['confirmed', 'completed'] } } }),
      Booking.count({ where: { status: 'pending' } }),
      AdServiceInquiry.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }]
      }),
      AdServiceInquiry.count({ where: { status: { [Op.in]: ['confirmed', 'completed'] } } }),
      AdServiceInquiry.count({ where: { status: 'pending' } }),
    ]);

    return res.json({
      success: true,
      data: {
        adServicesCount,
        advertisersCount,
        verifiedVendorsCount,
        pendingVendorsCount,
        verifiedAdSpacesCount,
        pendingAdSpacesCount,
        confirmedBookingsCount,
        pendingBookingsCount,
        recentInquiries,
        confirmedAdServiceBookingsCount,
        pendingAdServiceBookingsCount,
      },
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Admin listUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { name, email, phone, role, isActive, password } = req.body;

    if (name !== undefined) user.name = name === '' ? null : name;
    if (phone !== undefined) user.phone = phone === '' ? null : phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role != null && ['advertiser', 'space_owner', 'admin'].includes(role)) user.role = role;

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ success: false, message: 'Email is required.' });
      const existing = await User.findOne({ where: { email: trimmed } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      user.email = trimmed;
    }

    if (password !== undefined && password !== '') {
      user.password = String(password);
    }

    await user.save();
    const { password: _, ...safe } = user.toJSON();
    return res.json({ success: true, data: safe });
  } catch (err) {
    console.error('Admin updateUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function approveAdSpace(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    space.verified = true;
    await space.save();
    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('Admin approveAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function rejectAdSpace(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    
    space.verified = false;
    space.verificationStatus = 'rejected';
    space.rejectionReason = reason || 'No reason provided';
    await space.save();

    // Notify owner
    try {
      await Notification.create({
        userId: space.ownerId,
        title: 'Ad Space Verification Rejected',
        message: `Your ad space "${space.title}" was not verified. Reason: ${space.rejectionReason}. You can fix the issues and re-submit.`,
        type: 'system',
        link: '/owner/listings'
      });
    } catch (notifyErr) {
      console.error('Failed to notify owner of rejection:', notifyErr);
    }

    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('Admin rejectAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listPendingSpaces(req, res) {
  try {
    const spaces = await AdSpace.findAll({
      where: { verified: false },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
      order: [[sequelize.col('AdSpace.created_at'), 'DESC']],
    });
    return res.json({ success: true, data: spaces });
  } catch (err) {
    console.error('Admin listPendingSpaces error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listAllBookings(req, res) {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'] },
        { model: AdSpace, as: 'AdSpace', include: [{ model: User, as: 'User', attributes: ['id', 'name'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Admin listAllBookings error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** GET /api/admin/adspaces — list all ad spaces */
export async function listAdSpaces(req, res) {
  try {
    const spaces = await AdSpace.findAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
      order: [[sequelize.col('AdSpace.created_at'), 'DESC']],
    });
    return res.json({ success: true, data: spaces });
  } catch (err) {
    console.error('Admin listAdSpaces error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** POST /api/admin/adspaces — admin adds space directly (with existing owner or company details) */
export async function createAdSpace(req, res) {
  try {
    const {
      ownerId,
      companyName,
      companyEmail,
      title,
      description,
      city,
      location,
      adType,
      width,
      height,
      pricePerDay,
      pricePerSecond,
      imageUrl,
      videoUrl,
    } = req.body || {};

    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });

    let owner = null;
    if (ownerId) {
      owner = await User.findByPk(Number(ownerId));
      if (!owner) return res.status(404).json({ success: false, message: 'Selected owner not found.' });
    } else {
      const email = String(companyEmail || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Select an owner or provide company email.' });
      }
      owner = await User.findOne({ where: { email } });
      if (!owner) {
        const defaultPassword = `arcads-${Math.random().toString(36).slice(2, 10)}`;
        owner = await User.create({
          email,
          password: defaultPassword,
          name: companyName ? String(companyName).trim() : null,
          role: 'space_owner',
          isActive: true,
        });
      } else if (owner.role !== 'space_owner') {
        owner.role = 'space_owner';
        owner.isActive = true;
        await owner.save();
      }
    }

    const adTypeStr = adType ? String(adType).trim() : null;
    const pps = pricePerSecond != null && pricePerSecond !== '' ? Number(pricePerSecond) : null;
    const isDigital = adTypeStr === 'digital_screen' && pps != null && !Number.isNaN(pps) && pps > 0;

    const space = await AdSpace.create({
      ownerId: owner.id,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      city: city ? String(city).trim() : null,
      location: location ? String(location).trim() : null,
      adType: adTypeStr,
      width: width != null && width !== '' ? Number(width) : null,
      height: height != null && height !== '' ? Number(height) : null,
      pricePerDay: isDigital ? 0 : (pricePerDay != null && pricePerDay !== '' ? Number(pricePerDay) : 0),
      pricePerSecond: isDigital ? pps : null,
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      videoUrl: videoUrl ? String(videoUrl).trim() : null,
      verified: true,
    });

    const data = await AdSpace.findByPk(space.id, {
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Admin createAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/admin/adspaces/:id/verify — set verified = true */
export async function verifyAdSpace(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    
    space.verified = true;
    space.verificationStatus = 'verified';
    space.rejectionReason = null;
    await space.save();

    // Notify owner
    try {
      await Notification.create({
        userId: space.ownerId,
        title: 'Ad Space Verified',
        message: `Congratulations! Your ad space "${space.title}" has been verified and is now live on the marketplace.`,
        type: 'system',
        link: '/owner/listings'
      });
    } catch (notifyErr) {
      console.error('Failed to notify owner of verification:', notifyErr);
    }

    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('Admin verifyAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/admin/adspaces/:id/active — toggle active status */
export async function toggleAdSpaceActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    if (typeof isActive === 'boolean') {
      const wasActive = space.isActive;
      
      // RESTRICTION: Admin cannot reactivate if vendor voluntarily deactivated it
      if (isActive && !wasActive && !space.adminDeactivated) {
        return res.status(403).json({ success: false, message: 'This ad space was voluntarily deactivated by the vendor. Administrators cannot override this decision to reactivate it.' });
      }

      space.isActive = isActive;
      
      // If admin is deactivating, set the admin-deactivated flag
      // If admin is activating (only allowed if it was admin-deactivated), clear the flags
      if (!isActive) {
        space.adminDeactivated = true;
      } else {
        space.adminDeactivated = false;
        space.reactivationRequested = false;
      }
      
      await space.save();

      // Notify owner if status changed
      if (wasActive !== isActive) {
        try {
          await Notification.create({
            userId: space.ownerId,
            title: isActive ? 'Ad Space Activated' : 'Ad Space Deactivated',
            message: isActive 
              ? `Your ad space "${space.title}" has been activated by an administrator.`
              : `Your ad space "${space.title}" has been deactivated by an administrator. Please contact support for more details.`,
            type: 'system',
            link: `/owner/listings`
          });
        } catch (notifyErr) {
          console.error('Failed to send admin toggle notification:', notifyErr);
        }
      }
    }
    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('Admin toggleAdSpaceActive error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** PUT /api/admin/adservices/:id/active — toggle active status */
export async function toggleAdServiceActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const service = await AdService.findByPk(id);
    if (!service) return res.status(404).json({ success: false, message: 'Ad service not found.' });
    if (typeof isActive === 'boolean') {
      service.isActive = isActive;
      await service.save();
    }
    return res.json({ success: true, data: service });
  } catch (err) {
    console.error('Admin toggleAdServiceActive error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** DELETE /api/admin/users/:id */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.destroy();
    return res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('Admin deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** DELETE /api/admin/adspaces/:id */
export async function deleteAdSpace(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    await space.destroy();
    return res.json({ success: true, message: 'Ad space deleted.' });
  } catch (err) {
    console.error('Admin deleteAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listTemplates(req, res) {
  try {
    const templates = await AdTemplate.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [[sequelize.col('AdTemplate.created_at'), 'DESC']],
    });
    return res.json({ success: true, data: templates });
  } catch (err) {
    console.error('Admin listTemplates error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function createTemplate(req, res) {
  try {
    const { name, description, width, height, category, isActive } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Template name is required.' });
    const template = await AdTemplate.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      width: Number(width) || 1,
      height: Number(height) || 1,
      category: category ? String(category).trim() : null,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdBy: Number(req.headers['x-user-id']) || null,
    });
    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    console.error('Admin createTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const template = await AdTemplate.findByPk(id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });
    const { name, description, width, height, category, isActive } = req.body || {};
    if (name != null) template.name = String(name).trim();
    if (description !== undefined) template.description = description ? String(description).trim() : null;
    if (width != null) template.width = Number(width) || 1;
    if (height != null) template.height = Number(height) || 1;
    if (category !== undefined) template.category = category ? String(category).trim() : null;
    if (typeof isActive === 'boolean') template.isActive = isActive;
    await template.save();
    return res.json({ success: true, data: template });
  } catch (err) {
    console.error('Admin updateTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const template = await AdTemplate.findByPk(id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });
    await template.destroy();
    return res.json({ success: true, message: 'Template deleted.' });
  } catch (err) {
    console.error('Admin deleteTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
