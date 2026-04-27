/**
 * Reviews controller.
 */
import models from '../models/index.js';

const { Review, User, AdSpace } = models;

export async function create(req, res) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    const { adSpaceId, rating, comment } = req.body;
    if (!userId || !adSpaceId || !rating) {
      return res.status(400).json({ success: false, message: 'userId, adSpaceId, rating required.' });
    }
    const review = await Review.create({
      userId: Number(userId),
      adSpaceId: Number(adSpaceId),
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || null,
    });
    const withUser = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'User', attributes: ['id', 'name'] }],
    });
    return res.status(201).json({ success: true, data: withUser });
  } catch (err) {
    console.error('Review create error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listByAdSpace(req, res) {
  try {
    const { adSpaceId } = req.params;
    const reviews = await Review.findAll({
      where: { adSpaceId: Number(adSpaceId) },
      include: [{ model: User, as: 'User', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Review listByAdSpace error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
