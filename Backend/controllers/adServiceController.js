import models from '../models/index.js';
import { isFullyBooked } from '../scripts/automation.js';

const { AdService, AdServiceOption, Notification } = models;
const getTodayStr = () => new Date().toISOString().slice(0, 10);

function safeParse(value, fallback) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapService(record) {
  return {
    id: `custom-db-${record.id}`,
    dbId: record.id,
    category: record.category,
    title: record.title,
    subtitle: record.subtitle,
    description: record.description,
    image: record.image,
    images: safeParse(record.images, []),
    examples: safeParse(record.examples, []),
    features: safeParse(record.features, []),
    color: record.color,
    lightColor: record.lightColor,
    icon: record.icon,
    bookingFields: safeParse(record.bookingFields, []),
    criteriaValues: safeParse(record.criteriaValues, {}),
    pricingConfig: safeParse(record.pricingConfig, null),
    availableFrom: record.availableFrom || null,
    availableTo: record.availableTo || null,
    isActive: record.isActive ?? true,
    isCustom: true,
  };
}

export async function listAdServices(req, res) {
  try {
    const isPublic = !req.headers['x-admin-request']; // Optional: check if request is from public or admin
    const where = {};
    if (isPublic) where.isActive = true;

    const rows = await AdService.findAll({ 
      where,
      order: [['created_at', 'DESC']] 
    });
    return res.json({ success: true, data: rows.map(mapService) });
  } catch (err) {
    console.error('listAdServices error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function createAdService(req, res) {
  try {
    const {
      category,
      title,
      subtitle,
      description,
      image,
      images,
      examples,
      features,
      color,
      lightColor,
      icon,
      bookingFields,
      criteriaValues,
      pricingConfig,
      availableFrom,
      availableTo,
    } = req.body || {};

    if (!category || !title) {
      return res.status(400).json({ success: false, message: 'Category and title are required.' });
    }
    if (!availableFrom || !availableTo) {
      return res.status(400).json({ success: false, message: 'Availability period is required.' });
    }
    const today = getTodayStr();
    if (String(availableFrom) < today || String(availableTo) < today) {
      return res.status(400).json({ success: false, message: 'Availability dates cannot be before today.' });
    }
    if (new Date(availableFrom) > new Date(availableTo)) {
      return res.status(400).json({ success: false, message: 'Availability end date must be after start date.' });
    }

    const existing = await AdService.findOne({
      where: { category: String(category).trim(), title: String(title).trim() },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A service with this title already exists in this category.' });
    }

    const uploadedImages = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const finalImages = uploadedImages.filter(Boolean);

    const created = await AdService.create({
      category: String(category).trim(),
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : null,
      description: description ? String(description).trim() : null,
      image: finalImages[0] || null,
      images: JSON.stringify(finalImages),
      examples: JSON.stringify(safeParse(examples, [])),
      features: JSON.stringify(safeParse(features, [])),
      color: color ? String(color) : null,
      lightColor: lightColor ? String(lightColor) : null,
      icon: icon ? String(icon) : null,
      bookingFields: JSON.stringify(safeParse(bookingFields, [])),
      criteriaValues: JSON.stringify(safeParse(criteriaValues, {})),
      pricingConfig: pricingConfig ? JSON.stringify(safeParse(pricingConfig, null)) : null,
      availableFrom,
      availableTo,
      createdBy: Number(req.headers['x-user-id']) || null,
    });

    // Notify admin
    await Notification.create({
      userId: 1, // Super admin
      title: 'New Ad Service Added',
      message: `A new ad service "${title}" has been added.`,
      type: 'system',
      link: '/admin/ad-center',
    });

    return res.status(201).json({ success: true, data: mapService(created) });
  } catch (err) {
    console.error('createAdService error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}


export async function updateAdService(req, res) {
  try {
    const { id } = req.params;
    const service = await AdService.findByPk(Number(id));
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    const {
      category,
      title,
      subtitle,
      description,
      image,
      images,
      examples,
      features,
      color,
      lightColor,
      icon,
      bookingFields,
      criteriaValues,
      pricingConfig,
      availableFrom,
      availableTo,
    } = req.body || {};
    const uploadedImages = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const existingImages = safeParse(req.body.existingImages, []);
    const finalImages = [...existingImages, ...uploadedImages];

    if (!category || !title) {
      return res.status(400).json({ success: false, message: 'Category and title are required.' });
    }
    if (!availableFrom || !availableTo) {
      return res.status(400).json({ success: false, message: 'Availability period is required.' });
    }
    if (new Date(availableFrom) > new Date(availableTo)) {
      return res.status(400).json({ success: false, message: 'Availability end date must be after start date.' });
    }

    const duplicate = await AdService.findOne({
      where: { category: String(category).trim(), title: String(title).trim() },
    });
    if (duplicate && duplicate.id !== service.id) {
      return res.status(409).json({ success: false, message: 'A service with this title already exists in this category.' });
    }

    service.category = String(category).trim();
    service.title = String(title).trim();
    service.subtitle = subtitle ? String(subtitle).trim() : null;
    service.description = description ? String(description).trim() : null;
    service.image = finalImages[0] || null;
    service.images = JSON.stringify(finalImages);
    service.examples = JSON.stringify(safeParse(examples, []));
    service.features = JSON.stringify(safeParse(features, []));
    service.color = color ? String(color) : null;
    service.lightColor = lightColor ? String(lightColor) : null;
    service.icon = icon ? String(icon) : null;
    service.bookingFields = JSON.stringify(safeParse(bookingFields, []));
    service.criteriaValues = JSON.stringify(safeParse(criteriaValues, {}));
    service.pricingConfig = pricingConfig ? JSON.stringify(safeParse(pricingConfig, null)) : null;
    service.availableFrom = availableFrom;
    service.availableTo = availableTo;
    await service.save();

    return res.json({ success: true, data: mapService(service) });
  } catch (err) {
    console.error('updateAdService error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function listAdServiceOptions(req, res) {
  try {
    const { category, fieldKey } = req.query || {};
    const where = {};
    if (category) where.category = String(category).trim();
    if (fieldKey) where.fieldKey = String(fieldKey).trim();
    const rows = await AdServiceOption.findAll({ where, order: [['option_value', 'ASC']] });
    const data = rows.map((row) => ({
      id: row.id,
      category: row.category,
      fieldKey: row.fieldKey,
      optionValue: row.optionValue,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error('listAdServiceOptions error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function upsertAdServiceOption(req, res) {
  try {
    const { category, fieldKey, optionValue } = req.body || {};
    if (!category || !fieldKey || !optionValue) {
      return res.status(400).json({ success: false, message: 'category, fieldKey and optionValue are required.' });
    }
    const normalized = {
      category: String(category).trim(),
      fieldKey: String(fieldKey).trim(),
      optionValue: String(optionValue).trim(),
    };
    const existing = await AdServiceOption.findOne({ where: normalized });
    if (existing) {
      return res.json({
        success: true,
        data: { id: existing.id, ...normalized },
      });
    }
    const created = await AdServiceOption.create({
      ...normalized,
      createdBy: Number(req.headers['x-user-id']) || null,
    });
    return res.status(201).json({
      success: true,
      data: { id: created.id, ...normalized },
    });
  } catch (err) {
    console.error('upsertAdServiceOption error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function deleteAdServiceOption(req, res) {
  try {
    const { category, fieldKey, optionValue } = req.query || {};
    if (!category || !fieldKey || !optionValue) {
      return res.status(400).json({ success: false, message: 'category, fieldKey and optionValue are required.' });
    }
    const where = {
      category: String(category).trim(),
      fieldKey: String(fieldKey).trim(),
      optionValue: String(optionValue).trim(),
    };
    await AdServiceOption.destroy({ where });
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteAdServiceOption error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function deleteAdService(req, res) {
  try {
    const { id } = req.params;
    const service = await AdService.findByPk(Number(id));
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    await service.destroy();
    return res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (err) {
    console.error('deleteAdService error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function toggleAdServiceActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const service = await AdService.findByPk(Number(id));
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    // NEW: Prevent reactivation if date is expired or fully booked
    const todayStr = new Date().toISOString().slice(0, 10);
    if (isActive) {
      if (service.availableTo && service.availableTo < todayStr) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot activate an expired service. Please update the "Available To" (Ending On) date to a future date first.' 
        });
      }
      
      const isFull = await isFullyBooked('service', id);
      if (isFull) {
        return res.status(400).json({
          success: false,
          message: 'This service is completely filled for its availability period. Please update the "Available To" date or resolve existing inquiries before activating.'
        });
      }
    }

    service.isActive = isActive;
    await service.save();

    return res.json({ success: true, data: mapService(service) });
  } catch (err) {
    console.error('toggleAdServiceActive error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
