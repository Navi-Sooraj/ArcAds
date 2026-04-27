/**
 * Notifications controller.
 */
import models from '../models/index.js';

const { Notification } = models;

export async function list(req, res) {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, message: 'userId required.' });
    const notifications = await Notification.findAll({
      where: { userId: Number(userId) },
      order: [['isRead', 'ASC'], ['createdAt', 'DESC']],
      limit: 50,
    });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Notification list error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['x-user-id'];
    const notification = await Notification.findOne({ where: { id: Number(id), userId: Number(userId) } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    notification.isRead = true;
    await notification.save();
    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error('Notification markRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
export async function remove(req, res) {
  try {
    const { id } = req.params;
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, message: 'userId required.' });
    
    const notification = await Notification.findOne({ 
      where: { id: Number(id), userId: Number(userId) } 
    });
    
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    
    await notification.destroy();
    return res.json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    console.error('Notification remove error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
export async function markAllRead(req, res) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, message: 'userId required.' });
    
    await Notification.update(
      { isRead: true },
      { where: { userId: Number(userId), isRead: false } }
    );
    
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Notification markAllRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
