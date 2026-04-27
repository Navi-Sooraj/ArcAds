/**
 * Partner listings = Ad spaces by owner (partner).
 * Alias for listing ad spaces by owner; can extend with stats.
 */
import models from '../models/index.js';

const { AdSpace, User, Booking } = models;

export async function listPartners(req, res) {
  try {
    const owners = await User.findAll({
      where: { role: 'space_owner', isActive: true },
      attributes: ['id', 'name', 'email', 'phone'],
      include: [{
        model: AdSpace,
        as: 'AdSpaces',
        where: { verified: true },
        required: false,
        attributes: ['id', 'title', 'adType', 'location', 'city', 'pricePerDay'],
      }],
    });
    return res.json({ success: true, data: owners });
  } catch (err) {
    console.error('Partners list error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function partnerSpaces(req, res) {
  try {
    const ownerId = req.query.ownerId || req.params.ownerId;
    if (!ownerId) return res.status(400).json({ success: false, message: 'ownerId required.' });
    const spaces = await AdSpace.findAll({
      where: { ownerId: Number(ownerId), verified: true },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
    });
    return res.json({ success: true, data: spaces });
  } catch (err) {
    console.error('Partner spaces error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
