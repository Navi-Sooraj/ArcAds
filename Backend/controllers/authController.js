/**
 * Authentication controller.
 * Simple email + password comparison (no JWT, no hashing per requirements).
 * Session is maintained by returning user data; frontend can store in state/localStorage.
 */
import models from '../models/index.js';
import nodemailer from 'nodemailer';

const { User } = models;

async function sendPasswordChangeEmail(user) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || username;
  if (!host || !username || !password || !from || !user?.email) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: username, pass: password },
  });

  await transporter.sendMail({
    from,
    to: user.email,
    subject: 'ArcAds password changed',
    text: `Hello ${user.name || user.email}, your ArcAds password was changed successfully.`,
  });
  return true;
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      const isRenter = user.role === 'space_owner';
      const message = isRenter
        ? 'Your account is pending admin approval. You can sign in once an admin has approved your registration.'
        : 'Account is deactivated.';
      return res.status(403).json({ success: false, message });
    }
    const { password: _, ...userSafe } = user.toJSON();
    return res.json({ success: true, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    // Return actual error in response so UI can show it (e.g. DB table/column issues)
    const message = err.message || 'Server error.';
    return res.status(500).json({ success: false, message });
  }
}

export async function signup(req, res) {
  try {
    const { email, password, name, phone, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const allowedRoles = ['advertiser', 'space_owner'];
    const userRole = allowedRoles.includes(role) ? role : 'advertiser';
    // Renter (space_owner) needs admin approval before login; Consumer (advertiser) can login immediately
    const isActive = userRole === 'advertiser';
    const user = await User.create({
      email: normalizedEmail,
      password,
      name: name || null,
      phone: phone || null,
      role: userRole,
      isActive,
    });
    const { password: _, ...userSafe } = user.toJSON();
    return res.status(201).json({ success: true, user: userSafe, pendingApproval: userRole === 'space_owner' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

export async function getMe(req, res) {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required.' });
    }
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required.' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { name, phone } = req.body;
    if (name != null) user.name = name;
    if (phone != null) user.phone = phone;
    await user.save();
    const { password: _, ...safe } = user.toJSON();
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    const { currentPassword, newPassword } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required.' });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = String(newPassword);
    await user.save();
    const emailSent = await sendPasswordChangeEmail(user);
    return res.json({
      success: true,
      message: emailSent
        ? 'Password changed and confirmation email sent.'
        : 'Password changed (email not configured).',
    });
  } catch (err) {
    console.error('ChangePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/** GET /api/users - list all users (password excluded) */
export async function getUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('GetUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
