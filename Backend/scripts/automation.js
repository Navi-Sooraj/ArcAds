import models from '../models/index.js';
import { Op } from 'sequelize';

const { AdService, AdSpace, Booking, AdServiceInquiry, Notification } = models;

/**
 * Utility to get YYYY-MM-DD string
 */
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Utility: Returns an array of date strings for a range [start, end] inclusive.
 */
function getDaysInRange(start, end) {
  const dates = [];
  let curr = new Date(start);
  const stop = new Date(end);
  while (curr <= stop) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Notification Helper
 */
async function sendDeactivationNotice(userId, title, message, link) {
  if (!userId) return;
  try {
    await Notification.create({
      userId,
      title,
      message,
      type: 'system',
      link
    });
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
}

/**
 * CHECK EXPIRATIONS: Daily task to deactivate items past their 'available_to' date.
 */
export async function runDailyMaintenance() {
  const today = getTodayStr();
  console.log(`[Automation] Running maintenance for ${today}...`);

  try {
    // 1. Expired Ad Services
    const expiredServices = await AdService.findAll({
      where: {
        isActive: true,
        availableTo: { [Op.lt]: today }
      }
    });

    for (const svc of expiredServices) {
      svc.isActive = false;
      await svc.save();
      console.log(`Deactivated service: ${svc.title} (Expired)`);
      await sendDeactivationNotice(
        svc.createdBy || 1, 
        'Listing Expired',
        `Your ad service "${svc.title}" has been automatically deactivated because its availability period has ended.`,
        '/admin/ad-center'
      );
    }

    // 2. Expired Ad Spaces
    const expiredSpaces = await AdSpace.findAll({
      where: {
        isActive: true,
        availableTo: { [Op.lt]: today }
      }
    });

    for (const space of expiredSpaces) {
      space.isActive = false;
      await space.save();
      console.log(`Deactivated ad space: ${space.title} (Expired)`);
      await sendDeactivationNotice(
        space.ownerId,
        'Space Availability Expired',
        `Your ad space listing "${space.title}" has been automatically deactivated because its availability period has ended.`,
        '/owner'
      );
    }

  } catch (err) {
    console.error('[Automation] Maintenance error:', err);
  }
}

/**
 * INTERNAL UTILITY: Determine if a space or service is full.
 */
async function isItemFull(type, id) {
  if (type === 'space') {
    const space = await AdSpace.findByPk(id);
    if (!space || !space.availableFrom || !space.availableTo) return false;

    const bookings = await Booking.findAll({
      where: {
        adSpaceId: id,
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
      }
    });

    const requiredDays = getDaysInRange(space.availableFrom, space.availableTo);
    const bookedDays = new Set();
    bookings.forEach(b => {
      getDaysInRange(b.startDate, b.endDate).forEach(d => bookedDays.add(d));
    });

    return requiredDays.every(day => bookedDays.has(day));
  } else if (type === 'service') {
    const service = await AdService.findByPk(id);
    if (!service || !service.availableFrom || !service.availableTo) return false;

    const inquiries = await AdServiceInquiry.findAll({
      where: {
        serviceId: String(id),
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
      }
    });

    const requiredDays = getDaysInRange(service.availableFrom, service.availableTo);
    const bookedDays = new Set();
    
    inquiries.forEach(inq => {
      const data = typeof inq.formData === 'string' ? JSON.parse(inq.formData) : inq.formData;
      if (data.startDate && data.endDate) {
        getDaysInRange(data.startDate, data.endDate).forEach(d => bookedDays.add(d));
      } else if (data.eventDate) {
        bookedDays.add(data.eventDate);
      }
    });

    return requiredDays.every(day => bookedDays.has(day));
  }
  return false;
}

/**
 * EXPORTED: Just check if full
 */
export async function isFullyBooked(type, id) {
  return await isItemFull(type, id);
}

/**
 * CHECK FULLNESS: Verify if a space/service has no remaining slots.
 */
export async function checkAndHandleFullness(type, id) {
  try {
    const isFull = await isItemFull(type, id);
    if (!isFull) return;

    if (type === 'space') {
      const space = await AdSpace.findByPk(id);
      if (!space || !space.isActive) return;
      space.isActive = false;
      await space.save();
      console.log(`Deactivated space: ${space.title} (Fully Booked)`);
      await sendDeactivationNotice(
        space.ownerId,
        'Listing Fully Booked',
        `Your ad space "${space.title}" is now fully booked for its entire duration and has been automatically deactivated.`,
        '/owner'
      );
    } 
    else if (type === 'service') {
      const service = await AdService.findByPk(id);
      if (!service || !service.isActive) return;
      service.isActive = false;
      await service.save();
      console.log(`Deactivated service: ${service.title} (Fully Booked)`);
      await sendDeactivationNotice(
        service.createdBy || 1,
        'Service Fully Booked',
        `Your ad service "${service.title}" is now fully booked/reserved and has been automatically deactivated.`,
        '/admin/ad-center'
      );
    }
  } catch (err) {
    console.error(`[Automation] Fullness check error for ${type} ${id}:`, err);
  }
}
