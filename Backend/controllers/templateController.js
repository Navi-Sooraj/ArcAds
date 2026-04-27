import models, { sequelize } from '../models/index.js';

const { AdTemplate } = models;

export async function listActiveTemplates(_req, res) {
  try {
    if (!AdTemplate) {
      return res.json({ success: true, data: [] });
    }
    const templates = await AdTemplate.findAll({
      where: { isActive: true },
      order: [[sequelize.col('AdTemplate.created_at'), 'DESC']],
    });
    return res.json({ success: true, data: templates });
  } catch (err) {
    console.error('Template listActiveTemplates error:', err);
    // Return safe empty list to keep UI functional even if template table is missing/migrating.
    return res.json({ success: true, data: [] });
  }
}
