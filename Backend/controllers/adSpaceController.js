/**
 * Ad Space controller (legacy /api/ad-spaces).
 * Uses same AdSpace model with schema: city, adType, pricePerDay, imageUrl, verified.
 */
import models from '../models/index.js';
import { Op } from 'sequelize';

const { AdSpace, User } = models;

export async function list(req, res) {
  try {
    const { city, ad_type, search } = req.query;
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
    const spaces = await AdSpace.findAll({
      where,
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: spaces });
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
    return res.json({ success: true, data: space });
  } catch (err) {
    console.error('AdSpace getById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function create(req, res) {
  try {
    const ownerId = req.body.ownerId ?? req.headers['x-user-id'];
    if (!ownerId) return res.status(400).json({ success: false, message: 'Owner ID required.' });
    const { title, description, city, location, adType, width, height, pricePerDay, imageUrl } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    const space = await AdSpace.create({
      ownerId: Number(ownerId),
      title,
      description: description ?? null,
      city: city ?? null,
      location: location ?? null,
      adType: adType ?? null,
      width: width != null ? Number(width) : null,
      height: height != null ? Number(height) : null,
      pricePerDay: pricePerDay != null ? Number(pricePerDay) : 0,
      imageUrl: imageUrl ?? null,
      verified: false,
    });
    return res.status(201).json({ success: true, data: space });
  } catch (err) {
    console.error('AdSpace create error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const space = await AdSpace.findByPk(id);
    if (!space) return res.status(404).json({ success: false, message: 'Ad space not found.' });
    const { title, description, city, location, adType, width, height, pricePerDay, imageUrl, verified } = req.body;
    if (title != null) space.title = title;
    if (description != null) space.description = description;
    if (city != null) space.city = city;
    if (location != null) space.location = location;
    if (adType != null) space.adType = adType;
    if (width != null) space.width = Number(width);
    if (height != null) space.height = Number(height);
    if (pricePerDay != null) space.pricePerDay = Number(pricePerDay);
    if (imageUrl != null) space.imageUrl = imageUrl;
    if (typeof verified === 'boolean') space.verified = verified;
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

export async function listByOwner(req, res) {
  try {
    const ownerId = req.query.ownerId ?? req.headers['x-user-id'];
    if (!ownerId) return res.status(400).json({ success: false, message: 'Owner ID required.' });
    const spaces = await AdSpace.findAll({
      where: { ownerId: Number(ownerId) },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: spaces });
  } catch (err) {
    console.error('AdSpace listByOwner error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
