import { AD_SERVICES } from './adServices';
import api from '../api/axios';

const STORAGE_KEY = 'arcads.customAdServices';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readCustomServices() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toStorageSafeServices(services = []) {
  return (Array.isArray(services) ? services : []).map((svc) => {
    const images = Array.isArray(svc?.images) ? svc.images : [];
    const safeImages = images
      .filter((x) => typeof x === 'string' && !x.startsWith('data:'))
      .slice(0, 3);
    const primaryImage = (typeof svc?.image === 'string' && !svc.image.startsWith('data:'))
      ? svc.image
      : (safeImages[0] || '');
    return {
      ...svc,
      image: primaryImage || '',
      images: safeImages,
    };
  });
}

function writeCustomServices(services) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    return;
  } catch (err) {
    const msg = String(err?.message || '');
    if (!msg.toLowerCase().includes('quota')) return;
  }
  try {
    // Fallback cache: strip heavy base64 media to avoid quota overflow.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStorageSafeServices(services)));
  } catch {
    // If storage still fails, skip caching silently and rely on API.
  }
}

function makeId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugifyCategoryTitle(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Same slug rules as advertiser Ad Services routes (`/ad-services/:slug`). */
export function categoryTitleToSlug(title) {
  return slugifyCategoryTitle(title);
}

/**
 * Map stored category strings (full title, slug, or AD_SERVICES id) to the canonical display title.
 */
export function resolveCanonicalCategory(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim();
  if (!s) return '';
  const byExact = AD_SERVICES.find((x) => x.title === s);
  if (byExact) return byExact.title;
  const norm = (t) => String(t).trim().toLowerCase().replace(/\s+/g, ' ');
  const byTitleCi = AD_SERVICES.find((x) => norm(x.title) === norm(s));
  if (byTitleCi) return byTitleCi.title;
  const byId = AD_SERVICES.find((x) => x.id === s);
  if (byId) return byId.title;
  const slug = slugifyCategoryTitle(s);
  const bySlug = AD_SERVICES.find((x) => slugifyCategoryTitle(x.title) === slug);
  if (bySlug) return bySlug.title;
  return '';
}

/** Normalize category labels for comparisons (advertiser + admin). */
export function normalizeAdCategoryKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * True if a service row belongs to a catalog category (full title from AD_SERVICES).
 * Handles canonical title, id, slug, and minor spacing differences.
 */
export function serviceBelongsToCanonicalCategory(svc, canonicalCategoryTitle) {
  if (!svc || !canonicalCategoryTitle) return false;
  const target = normalizeAdCategoryKey(canonicalCategoryTitle);
  const canon = resolveCanonicalCategory(svc.category) || String(svc.category || '').trim();
  if (normalizeAdCategoryKey(canon) === target) return true;
  const slugT = slugifyCategoryTitle(canonicalCategoryTitle);
  const slugS = slugifyCategoryTitle(String(svc.category || ''));
  return Boolean(slugT && slugS && slugT === slugS);
}

export function localTodayDateStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toDateOnlyString(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isCustomAdServiceInAvailabilityWindow(svc) {
  if (!svc?.isCustom) return true;
  if (!svc.availableTo) return true;
  const today = localTodayDateStr();
  const to = toDateOnlyString(svc.availableTo);
  if (!to) return true;
  // If the availableTo date has already passed, it's outdated.
  return today <= to;
}

/** Pricing line for admin + advertiser service cards (matches Ad Center chip text). */
export function formatAdServicePricingLabel(svc) {
  const cfg = svc?.pricingConfig;
  if (!cfg) return 'Not set';
  if (cfg.type === 'tv_time_hourly') {
    const rates = Object.values(cfg.ratesByPreference || {})
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0);
    const min = rates.length ? Math.min(...rates) : 0;
    return min > 0 ? `TV Time-wise (from Rs ${min.toLocaleString()}/hr)` : 'TV Time-wise';
  }
  if (cfg.type === 'event_tier') {
    const rates = Object.values(cfg.ratesByTier || {})
      .map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
    const min = rates.length ? Math.min(...rates) : 0;
    return min > 0 ? `Tier-wise (from Rs ${min.toLocaleString()})` : 'Tier-wise';
  }
  if (cfg.type === 'fixed') return `Fixed - Rs ${Number(cfg.rate || 0).toLocaleString()}`;
  if (cfg.type === 'per_day') return `Per Day - Rs ${Number(cfg.rate || 0).toLocaleString()}`;
  if (cfg.type === 'per_quantity') return `Per Quantity - Rs ${Number(cfg.rate || 0).toLocaleString()}`;
  return 'Not set';
}

export function adServiceMediaCount(svc) {
  if (Array.isArray(svc?.images) && svc.images.length > 0) return svc.images.length;
  return svc?.image ? 1 : 0;
}

export function getServiceCategories() {
  return AD_SERVICES.map((svc) => svc.title);
}

export function getAllAdServices() {
  return composeAdServices(readCustomServices());
}

export function composeAdServices(customServices = []) {
  const baseServices = AD_SERVICES.map((svc) => ({
    ...svc,
    category: svc.title,
    isCustom: false,
  }));
  const normalizedCustom = customServices.map((svc) => ({
    ...svc,
    isCustom: true,
  }));
  return [...baseServices, ...normalizedCustom];
}

export function getCategoryTemplate(category) {
  if (category == null || category === '') return AD_SERVICES[0] || null;
  const resolved = resolveCanonicalCategory(category) || String(category).trim();
  const byExact = AD_SERVICES.find((svc) => svc.title === resolved);
  if (byExact) return byExact;
  const nk = normalizeAdCategoryKey(resolved);
  const byNk = AD_SERVICES.find((svc) => normalizeAdCategoryKey(svc.title) === nk);
  if (byNk) return byNk;
  return AD_SERVICES[0] || null;
}

export function getCategoryRequirements(category) {
  const template = getCategoryTemplate(category);
  return template?.bookingFields || [];
}

export function getCustomAdServicesByCategory(category) {
  return readCustomServices().filter((svc) => svc.category === category);
}

export async function fetchCustomAdServicesFromApi(isAdmin = false) {
  const config = isAdmin ? { headers: { 'x-admin-request': 'true' } } : {};
  const res = await api.get('ad-services', config);
  const rows = res?.data?.data || [];
  writeCustomServices(rows);
  return rows;
}

export function addCustomAdService(payload) {
  const categoryTemplate = getCategoryTemplate(payload.category);
  const existing = readCustomServices();
  const bookingFields = Array.isArray(payload.bookingFields) && payload.bookingFields.length > 0
    ? payload.bookingFields
    : (categoryTemplate?.bookingFields || []);

  const newService = {
    id: makeId(),
    category: payload.category,
    title: payload.title,
    subtitle: payload.subtitle,
    description: payload.description,
    examples: payload.examples,
    features: payload.features,
    image: payload.image || categoryTemplate?.image,
    images: payload.images || (payload.image ? [payload.image] : []),
    color: categoryTemplate?.color || '#1565C0',
    lightColor: categoryTemplate?.lightColor || '#E3F2FD',
    icon: categoryTemplate?.icon,
    bookingFields,
    criteriaValues: payload.criteriaValues || {},
    pricingConfig: payload.pricingConfig || null,
    availableFrom: payload.availableFrom || null,
    availableTo: payload.availableTo || null,
  };

  const updated = [newService, ...existing];
  writeCustomServices(updated);
  return newService;
}

export async function addCustomAdServiceToApi(payload) {
  const isFormData = payload instanceof FormData;
  const category = isFormData ? payload.get('category') : payload.category;
  const categoryTemplate = getCategoryTemplate(category);

  let bookingFields = isFormData ? payload.get('bookingFields') : payload.bookingFields;
  if (isFormData && typeof bookingFields === 'string') {
    try { bookingFields = JSON.parse(bookingFields); } catch { bookingFields = null; }
  }
  const finalBookingFields = Array.isArray(bookingFields) && bookingFields.length > 0
    ? bookingFields
    : (categoryTemplate?.bookingFields || []);

  const res = await api.post('ad-services', payload);
  const created = res?.data?.data;
  if (created && created.id) {
    try {
      const merged = [created, ...readCustomServices().filter((x) => x.id !== created.id)];
      writeCustomServices(merged);
    } catch {
      // ignore cache merge issues
    }
  }
  return created;
}

export async function updateCustomAdServiceToApi(id, payload) {
  const isFormData = payload instanceof FormData;
  const numericId = String(id).replace('custom-db-', '');
  const res = await api.put(`ad-services/${numericId}`, payload);
  const updated = res?.data?.data;
  if (updated && updated.id) {
    try {
      const merged = [updated, ...readCustomServices().filter((x) => x.id !== updated.id)];
      writeCustomServices(merged);
    } catch {
      // ignore cache merge issues
    }
  }
  return updated;
}

export async function fetchAdServiceOptionsFromApi({ category, fieldKey }) {
  const res = await api.get('ad-services/options', { params: { category, fieldKey } });
  return res?.data?.data || [];
}

export async function upsertAdServiceOptionToApi({ category, fieldKey, optionValue }) {
  const res = await api.post('ad-services/options', { category, fieldKey, optionValue });
  return res?.data?.data || null;
}

export async function deleteAdServiceOptionFromApi({ category, fieldKey, optionValue }) {
  await api.delete('ad-services/options', { params: { category, fieldKey, optionValue } });
}

export async function deleteCustomAdServiceFromApi(id) {
  const numericId = String(id).replace('custom-db-', '');
  await api.delete(`ad-services/${numericId}`);
  try {
    const remaining = readCustomServices().filter((x) => String(x.id) !== String(id));
    writeCustomServices(remaining);
  } catch {
    // ignore cache issues
  }
}
