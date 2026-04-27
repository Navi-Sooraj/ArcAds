import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Chip, Stack, Divider, Button, Paper, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell, IconButton, Tooltip,
  Tab, Tabs, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete, InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InboxIcon from '@mui/icons-material/Inbox';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import PaidIcon from '@mui/icons-material/Paid';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Search from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  composeAdServices,
  getAllAdServices,
  addCustomAdServiceToApi,
  updateCustomAdServiceToApi,
  fetchCustomAdServicesFromApi,
  getServiceCategories,
  getCategoryTemplate,
  getCategoryRequirements,
  fetchAdServiceOptionsFromApi,
  upsertAdServiceOptionToApi,
  deleteAdServiceOptionFromApi,
  deleteCustomAdServiceFromApi,
  resolveCanonicalCategory,
  formatAdServicePricingLabel,
  adServiceMediaCount,
} from '../../data/adServicesStore';
import api from '../../api/axios';
import { checkIfVideo, resolveUploadUrl } from '../../utils/mediaUrl';


function AdminServiceCard({ svc, openEditDialog, setPreviewImages, setPreviewImageIdx, setPreviewImage, onDelete, onToggleActive }) {
  const [flipped, setFlipped] = React.useState(false);
  const heroSrc = (svc.images && svc.images[0]) || svc.image || '';
  const isVid = checkIfVideo(heroSrc);
  const criteriaEntries = Object.entries(svc.criteriaValues || {}).filter(([, v]) => String(v || '').trim());

  return (
    <Box sx={{ perspective: '1200px' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT — sits in normal flow to set the container height */}
        <Card
          elevation={0}
          variant="outlined"
          sx={{
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            borderRadius: 2.5, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'box-shadow 0.2s',
            visibility: flipped ? 'hidden' : 'visible',
            '&:hover': { boxShadow: 6, transform: 'none' },
            filter: svc.isActive ? 'none' : 'grayscale(100%) opacity(0.7)',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {isVid ? (
              <Box
                component="video"
                src={resolveUploadUrl(heroSrc)}
                preload="metadata"
                onLoadedMetadata={(e) => { e.target.currentTime = 0.5; }}
                sx={{ width: '100%', height: 120, objectFit: 'cover', bgcolor: '#000', display: 'block' }}
                muted
              />
            ) : (
              <CardMedia component="img" height="120" image={resolveUploadUrl(heroSrc)} alt={svc.title} sx={{ objectFit: 'cover' }} />
            )}
            <Box
              onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
              sx={{
                position: 'absolute', top: 8, right: 8,
                bgcolor: 'rgba(255,255,255,0.92)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: 2,
                '&:hover': { bgcolor: 'white', transform: 'scale(1.12)' },
                transition: 'all 0.2s',
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            </Box>
            
            {/* Activation Toggle */}
            <Box
              sx={{
                position: 'absolute', top: 8, left: 8,
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: '20px',
                px: 1,
                py: 0.2,
                display: 'flex',
                alignItems: 'center',
                boxShadow: 2,
                zIndex: 2
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ mr: 0.5, color: svc.isActive ? 'success.main' : 'text.secondary', fontSize: 10 }}>
                {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Typography>
              <Switch
                size="small"
                checked={!!svc.isActive}
                disabled={!svc.isCustom}
                onChange={() => onToggleActive(svc)}
                sx={{
                  width: 32,
                  height: 18,
                  padding: 0,
                  '& .MuiSwitch-switchBase': {
                    padding: 0,
                    margin: '2px',
                    '&.Mui-checked': {
                      transform: 'translateX(14px)',
                      color: '#fff',
                      '& + .MuiSwitch-track': {
                        backgroundColor: 'success.main',
                        opacity: 1,
                        border: 0,
                      },
                    },
                  },
                  '& .MuiSwitch-thumb': {
                    width: 14,
                    height: 14,
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: 18 / 2,
                    backgroundColor: '#bbb',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          </Box>
          <Box sx={{ height: 4, bgcolor: svc.color }} />
          <CardContent sx={{ pb: 1.2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25 }}>{svc.title}</Typography>
            {String(svc.subtitle || '').trim() && (
              svc.category === 'Online Advertising' ? (
                <Box
                  component="a"
                  href={svc.subtitle.startsWith('http') ? svc.subtitle : `https://${svc.subtitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-block',
                    mt: 0.5,
                    mb: 1,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: '20px',
                    bgcolor: (theme) => `${theme.palette.primary.main}10`,
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    transition: '0.2s',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                  }}
                >
                  View App / Site
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{svc.subtitle}</Typography>
              )
            )}
            <Stack direction="row" gap={0.8} flexWrap="wrap" sx={{ mt: 0.8 }}>
              <Chip size="small" color="primary" label={`Pricing: ${formatAdServicePricingLabel(svc)}`} />
            </Stack>
            {svc.availableFrom && svc.availableTo && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                Available: {(() => {
                  const dayAfterTomorrow = dayjs().add(2, 'day').format('YYYY-MM-DD');
                  const start = svc.availableFrom && svc.availableFrom > dayAfterTomorrow ? svc.availableFrom : dayAfterTomorrow;
                  return dayjs(start).format(DISPLAY_DATE_FORMAT);
                })()} → {dayjs(svc.availableTo).format(DISPLAY_DATE_FORMAT)}
              </Typography>
            )}
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button fullWidth variant="outlined" size="small" startIcon={<EditIcon />} disabled={!svc.isCustom} onClick={() => openEditDialog(svc)}>Edit</Button>
            <Button
              fullWidth variant="outlined" size="small" startIcon={<VisibilityIcon />}
              onClick={() => {
                const imgs = Array.isArray(svc.images) && svc.images.length > 0 ? svc.images : (svc.image ? [svc.image] : []);
                if (imgs.length > 0) { setPreviewImages(imgs); setPreviewImageIdx(0); setPreviewImage(imgs[0]); }
              }}
            >View Images</Button>
            <Tooltip title="Delete Service">
              <IconButton
                size="small"
                color="error"
                disabled={!svc.isCustom}
                onClick={() => onDelete(svc)}
                sx={{
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 1,
                  opacity: 0.8,
                  '&:hover': { opacity: 1, bgcolor: 'error.main', color: 'white' }
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>

        {/* BACK — overlays the front absolutely, matching its height */}
        <Card
          elevation={0}
          variant="outlined"
          sx={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 2.5, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            bgcolor: 'background.paper',
            '&:hover': { transform: 'rotateY(180deg)' },
          }}
        >
          <Box sx={{ height: 4, bgcolor: svc.color }} />
          <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>{svc.title}</Typography>
              <Box
                onClick={() => setFlipped(false)}
                sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: 20, lineHeight: 1, ml: 1, flexShrink: 0, '&:hover': { color: 'text.primary' } }}
              >✕</Box>
            </Stack>
            {String(svc.description || '').trim() && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>{svc.description}</Typography>
            )}
            <Divider sx={{ mb: 1.2 }} />
            <Stack spacing={0.7}>
              {criteriaEntries.filter(([key]) => !['notes', 'adType', 'width', 'height', 'from', 'to'].includes(key)).map(([key, val]) => (
                <Box key={key} sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'capitalize', minWidth: 80 }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</Typography>
                  <Typography variant="caption" color="text.secondary">{String(val)}</Typography>
                </Box>
              ))}
              
              {(svc.criteriaValues?.width || svc.criteriaValues?.height) && (
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ minWidth: 80 }}>Size:</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {svc.criteriaValues?.width || '—'} (w) x {svc.criteriaValues?.height || '—'} (h)
                  </Typography>
                </Box>
              )}

              {(svc.criteriaValues?.from || svc.criteriaValues?.to) && (
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ minWidth: 80 }}>Route:</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {svc.criteriaValues?.from || '—'} → {svc.criteriaValues?.to || '—'}
                  </Typography>
                </Box>
              )}
            </Stack>
            {((svc.bookingFields || []).find(f => f.key === 'adType')?.options || []).length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 80 }}>Ad Type:</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(svc.bookingFields || []).find(f => f.key === 'adType').options.join(', ')}
                </Typography>
              </Box>
            )}
            {String(svc.criteriaValues?.notes || '').trim() && (
              <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>Additional Notes</Typography>
                <Typography variant="caption">{String(svc.criteriaValues.notes).trim()}</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export default function AdCenter() {
  const location = useLocation();
  const MAX_MEDIA_FILES = 12;
  const MAX_SINGLE_FILE_MB = 500;
  const MAX_TOTAL_MEDIA_MB = 1000;
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem('arcads.admin.adCenter.tab');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [selected, setSelected] = useState(null);
  const [inquirySearch, setInquirySearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryDetailOpen, setInquiryDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('arcads.admin.adCenter.activeCategory') || '';
  });
  const [addError, setAddError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [criteriaValues, setCriteriaValues] = useState({});
  const [serviceSearch, setServiceSearch] = useState('');
  const [customServices, setCustomServices] = useState(() => {
    const cached = getAllAdServices().filter((svc) => svc?.isCustom);
    return Array.isArray(cached) ? cached : [];
  });
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [pricingConfig, setPricingConfig] = useState({
    type: 'fixed',
    rate: '',
  });
  const [tvTimeRates, setTvTimeRates] = useState({});
  const [customTimingLabel, setCustomTimingLabel] = useState('');
  const [eventTierOptions, setEventTierOptions] = useState([]);
  const [eventTierRates, setEventTierRates] = useState({});
  const [eventTierInputValue, setEventTierInputValue] = useState('');
  const [slotDurationOptions, setSlotDurationOptions] = useState([]);
  const [slotDurationInputValue, setSlotDurationInputValue] = useState('');
  const [adDurationInputValue, setAdDurationInputValue] = useState('');
  const [audienceOptions, setAudienceOptions] = useState([]);
  const [audienceInputValue, setAudienceInputValue] = useState('');
  const [adTypeOptions, setAdTypeOptions] = useState([]);
  const [adTypeInputValue, setAdTypeInputValue] = useState('');
  const [newService, setNewService] = useState({
    category: '',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    images: [],
    availableFrom: '',
    availableTo: '',
  });
  const [originalAvailableFrom, setOriginalAvailableFrom] = useState('');
  const [dateError, setDateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpsertingOption, setIsUpsertingOption] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = getServiceCategories();
  const normalizeCategory = (value) => String(value || '').trim().toLowerCase();
  const getMinDateStr = () => dayjs().add(2, 'day').format('YYYY-MM-DD');
  const minAvailableDateStr = getMinDateStr();
  const todayStr = dayjs().format('YYYY-MM-DD');
  const allServices = useMemo(() => composeAdServices(customServices), [customServices, refreshTick]);
  const hasInvalidDates = Boolean(
    !newService.availableFrom
    || !newService.availableTo
    || (newService.availableFrom < minAvailableDateStr)
    || (newService.availableTo < minAvailableDateStr)
    || newService.availableTo < newService.availableFrom
  );

  const formStateStr = JSON.stringify({
    newService,
    pricingConfig,
    tvTimeRates,
    eventTierRates,
    criteriaValues,
    eventTierOptions,
    slotDurationOptions,
    audienceOptions,
    adTypeOptions,
  });

  const prevAddOpen = useRef(false);
  const initialFormStateRef = useRef(null);
  const servicePanelRef = useRef(null);
  const formScrollRef = useRef(null);

  useEffect(() => {
    if (addOpen && !prevAddOpen.current) {
      initialFormStateRef.current = formStateStr;
    }
    prevAddOpen.current = addOpen;
  }, [addOpen, formStateStr]);

  useEffect(() => {
    if (addOpen) setAddError('');
  }, [formStateStr, addOpen]);

  // isDirty is only true once we've captured the initial state (ref is not null) AND the form has changed
  const isDirty = addOpen && initialFormStateRef.current !== null && formStateStr !== initialFormStateRef.current;

  useEffect(() => {
    fetchCustomAdServicesFromApi(true)
      .then((rows) => setCustomServices(Array.isArray(rows) ? rows : []))
      .catch(() => {
        // Keep cached/custom state on transient API failures.
      });
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
    if (categories.length > 0 && !newService.category) {
      const initialCategory = categories[0];
      setNewService((prev) => ({ ...prev, category: initialCategory }));
      initializeCriteriaValues(initialCategory);
    }
  }, [categories, activeCategory, newService.category]);

  useEffect(() => {
    if (tab === 1) {
      setLoadingInquiries(true);
      api.get('ad-service-inquiries')
        .then((res) => setInquiries(res.data.data || []))
        .catch(() => setInquiries([]))
        .finally(() => setLoadingInquiries(false));
    }
    localStorage.setItem('arcads.admin.adCenter.tab', tab);
  }, [tab]);

  useEffect(() => {
    if (location.state?.tab !== undefined) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (activeCategory) {
      localStorage.setItem('arcads.admin.adCenter.activeCategory', activeCategory);
    }
  }, [activeCategory]);

  const handleInquiryStatusChange = async (id, status) => {
    try {
      const res = await api.patch(`ad-service-inquiries/${id}/status`, { status });
      if (res.data.success) {
        setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const handleDeleteClick = (svc) => {
    setServiceToDelete(svc);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomAdServiceFromApi(serviceToDelete.id);
      setCustomServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
      setRefreshTick((x) => x + 1);
    } catch (err) {
      console.error('Delete failed:', err);
      // alert('Could not delete service. It might be linked to existing inquiries.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (svc) => {
    if (!svc.isCustom || !svc.dbId) return;
    const newStatus = !svc.isActive;
    
    // Client-side quick check for activation
    if (newStatus) {
      if (svc.availableTo && svc.availableTo < todayStr) {
        alert('Cannot activate an expired service. Please update the "Available To" (Ending On) date to a future date in the Edit dialog first.');
        return;
      }
      // Note: Fullness check still requires API, but the backend will catch it.
    }

    try {
      const res = await api.put(`admin/adservices/${svc.dbId}/active`, { isActive: newStatus });
      if (res.data.success) {
        setCustomServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, isActive: newStatus } : s)));
        setRefreshTick((x) => x + 1);
      }
    } catch (err) {
      console.error('Toggle active failed:', err);
      const msg = err.response?.data?.message || 'Failed to update status';
      alert(msg);
      // Explicitly refresh from API to ensure local state matches server (resetting toggle)
      fetchCustomAdServicesFromApi(true).then(rows => setCustomServices(rows));
    }
  };

  // We no longer fetch shared tiers/eventTypes for 'Event & Sponsorship Advertising' 
  // because the user wants them to be separate and unique for each service.
  /*
  useEffect(() => {
    if (newService.category !== 'Event & Sponsorship Advertising' || !addOpen) return;
    Promise.all([
      fetchAdServiceOptionsFromApi({ category: 'Event & Sponsorship Advertising', fieldKey: 'eventType' }),
      fetchAdServiceOptionsFromApi({ category: 'Event & Sponsorship Advertising', fieldKey: 'tier' }),
    ])
      .then(([eventTypeRows, tierRows]) => {
        const typeValues = eventTypeRows.map((x) => String(x.optionValue || '').trim()).filter(Boolean);
        const tierValues = tierRows.map((x) => String(x.optionValue || '').trim()).filter(Boolean);
        setEventTypeOptions((prev) => Array.from(new Set([...prev, ...typeValues])));
        setEventTierOptions((prev) => Array.from(new Set([...prev, ...tierValues])));
      })
      .catch(() => {
        // keep existing options if db read fails
      });
  }, [newService.category, addOpen]);
  */

  useEffect(() => {
    if (newService.category !== 'Digital Screens & Mall Advertising' || !addOpen) return;
    fetchAdServiceOptionsFromApi({ category: 'Digital Screens & Mall Advertising', fieldKey: 'slotDuration' })
      .then((rows) => {
        const values = rows.map((x) => String(x.optionValue || '').trim()).filter(Boolean);
        setSlotDurationOptions((prev) => Array.from(new Set([...prev, ...values])));
      })
      .catch(() => {
        // keep existing options if db read fails
      });
  }, [newService.category, addOpen]);

  const selectedCategoryRequirements = getCategoryRequirements(newService.category);
  const isTvCategory = newService.category === 'TV Channel Advertising';
  const isEventCategory = newService.category === 'Event & Sponsorship Advertising';
  const isMallCategory = newService.category === 'Digital Screens & Mall Advertising';
  const tvTimePreferenceField = selectedCategoryRequirements.find((f) => f.key === 'timePreference');
  const tvTimePreferences = tvTimePreferenceField?.options || [];
  const tvTimingOptions = Object.keys(tvTimeRates).filter((x) => String(x).trim() !== '');
  const isOnlineAdCategory = newService.category === 'Online Advertising';
  const criteriaRequirements = selectedCategoryRequirements.filter((f) => {
    const key = String(f.key || '').toLowerCase();
    return !['budget', 'duration', 'days', 'platform', 'audience', 'adtype', 'slotduration', 'adduration', 'tier', 'eventtype', 'timepreference', 'from', 'to'].includes(key);
  });
  const requiredCriteria = criteriaRequirements.filter((f) => {
    const key = String(f.key || '').toLowerCase();
    return !key.includes('note') && !key.includes('design') && !key.includes('additional');
  });
  const numericCategoryRequirements = selectedCategoryRequirements.filter((f) => f.type === 'number');

  const allRequirementsFilled = useMemo(() => {
    if (!newService.category || !newService.title || !newService.availableFrom || !newService.availableTo) return false;
    if (!Array.isArray(newService.images) || newService.images.length === 0) return false;
    
    // Check required criteria fields
    const missing = requiredCriteria.find(req => !criteriaValues[req.key]?.toString().trim());
    if (missing) return false;

    // Online Ads specific
    if (isOnlineAdCategory && !newService.subtitle?.trim()) return false;

    // Transportation specific - Travel fields are required
    if (newService.category === 'Transportation Advertising') {
      if (!criteriaValues.from?.toString().trim() || !criteriaValues.to?.toString().trim()) return false;
    }

    // Pricing checks
    if (!isTvCategory && !isEventCategory) {
      if (!pricingConfig.rate || Number(pricingConfig.rate) <= 0) return false;
    }
    
    return true;
  }, [newService, criteriaValues, pricingConfig, requiredCriteria, isTvCategory, isEventCategory, isOnlineAdCategory]);
  const activeCategoryServices = allServices.filter((svc) => {
    if (!svc.isCustom) return false;
    const canon = resolveCanonicalCategory(svc.category) || svc.category;
    return normalizeCategory(canon) === normalizeCategory(activeCategory);
  });
  const filteredActiveCategoryServices = activeCategoryServices
    .slice()
    .filter((svc) => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return true;
    const inFeatures = (svc.features || []).join(' ').toLowerCase();
    return (
      String(svc.title || '').toLowerCase().includes(q)
      || String(svc.subtitle || '').toLowerCase().includes(q)
      || inFeatures.includes(q)
    );
    });

  const getSavedCategoryOptions = (category, fieldKey) => {
    const values = new Set();
    customServices
      .filter((svc) => svc.category === category)
      .forEach((svc) => {
        const field = (svc.bookingFields || []).find((f) => f.key === fieldKey);
        (field?.options || []).forEach((opt) => {
          const normalized = String(opt || '').trim();
          if (normalized) values.add(normalized);
        });
      });
    return Array.from(values);
  };

  const initializeCriteriaValues = (category) => {
    const requirements = getCategoryRequirements(category);
    const next = { platform: '' };
    requirements.forEach((req) => {
      next[req.key] = '';
    });
    setCriteriaValues(next);
    setPricingConfig((prev) => ({
      ...prev,
    }));
    const tpField = requirements.find((f) => f.key === 'timePreference');
    const rateMap = {};
    (tpField?.options || []).forEach((opt) => { rateMap[opt] = ''; });
    setTvTimeRates(rateMap);
    const tierField = requirements.find((f) => f.key === 'tier');
    // Start with empty tier options for 'Event & Sponsorship Advertising' as requested
    const nextTierOptions = category === 'Event & Sponsorship Advertising' 
      ? [] 
      : Array.from(new Set([...(tierField?.options || []), ...getSavedCategoryOptions(category, 'tier')]));
    
    setEventTierOptions(nextTierOptions);
    const initialTierRates = {};
    nextTierOptions.forEach((tier) => { initialTierRates[tier] = ''; });
    setEventTierRates(initialTierRates);

    const slotDurationField = requirements.find((f) => f.key === 'slotDuration');
    const savedSlotOptions = getSavedCategoryOptions(category, 'slotDuration');
    const nextSlotOptions = Array.from(new Set([...(slotDurationField?.options || []), ...savedSlotOptions]));
    setSlotDurationOptions(nextSlotOptions);

    setEventTierInputValue('');
    setSlotDurationInputValue('');
    setAdDurationInputValue('');
    setAudienceInputValue('');
    setAdTypeInputValue('');
  };

  const resetForm = (category = newService.category) => {
    setIsEditMode(false);
    setEditingServiceId(null);
    setNewService({
      category: category || '',
      title: '',
      subtitle: '',
      description: '',
      image: '',
      images: [],
      availableFrom: '',
      availableTo: '',
    });
    setOriginalAvailableFrom('');
    setDateError('');
    setPricingConfig({ type: 'fixed', rate: '' });
    setCustomTimingLabel('');
    setEventTierOptions([]);
    setEventTierRates({});
    setEventTypeOptions([]);
    setEventTypeRates({});
    setEventTypeInputValue('');
    setEventTierInputValue('');
    setAudienceOptions([]);
    setAudienceInputValue('');
    setAdTypeOptions([]);
    setAdTypeInputValue('');
    initializeCriteriaValues(category || '');
  };

  const openEditDialog = (svc) => {
    setIsEditMode(true);
    setEditingServiceId(svc.id);
    setAddError('');
    setNewService({
      category: svc.category || '',
      title: svc.title || '',
      subtitle: svc.subtitle || '',
      description: svc.description || '',
      image: svc.image || '',
      images: Array.isArray(svc.images) && svc.images.length > 0 ? svc.images : (svc.image ? [svc.image] : []),
      availableFrom: svc.availableFrom || '',
      availableTo: svc.availableTo || '',
    });
    setOriginalAvailableFrom(svc.availableFrom || '');
    setDateError('');
    const pricing = svc.pricingConfig || { type: 'fixed', rate: '' };
    setPricingConfig({
      type: pricing.type || 'fixed',
      rate: pricing.rate || '',
    });
    const existingRates = pricing.ratesByPreference || {};
    if (Object.keys(existingRates).length > 0) {
      setTvTimeRates(existingRates);
    } else {
      const reqsForEdit = getCategoryRequirements(svc.category || '');
      const tpField = reqsForEdit.find((f) => f.key === 'timePreference');
      const defaults = {};
      (tpField?.options || []).forEach((opt) => { defaults[opt] = ''; });
      setTvTimeRates(defaults);
    }
    setCustomTimingLabel('');
    const reqs = getCategoryRequirements(svc.category || '');
    const next = { platform: svc.criteriaValues?.platform || svc.criteriaValues?.platformPreference || '' };
    reqs.forEach((r) => { next[r.key] = svc.criteriaValues?.[r.key] || ''; });
    setCriteriaValues(next);
    const savedTierField = (svc.bookingFields || []).find((f) => f.key === 'tier');
    const savedSlotDurationField = (svc.bookingFields || []).find((f) => f.key === 'slotDuration');
    const savedAudienceField = (svc.bookingFields || []).find((f) => f.key === 'audience');
    const savedAdTypeField = (svc.bookingFields || []).find((f) => f.key === 'adType');

    const templateTierField = reqs.find((f) => f.key === 'tier');
    const templateAudienceField = reqs.find((f) => f.key === 'audience');
    const templateAdTypeField = reqs.find((f) => f.key === 'adType');
    const templateSlotDurationField = reqs.find((f) => f.key === 'slotDuration');

    const tierOptions = savedTierField?.options || templateTierField?.options || [];
    const audienceOpts = savedAudienceField?.options || [];
    const adTypeOpts = savedAdTypeField?.options || [];
    const slotOptions = savedSlotDurationField?.options || templateSlotDurationField?.options || [];
    setAdTypeOptions(adTypeOpts);
    setSlotDurationOptions(slotOptions);
    setAdDurationInputValue(svc.criteriaValues?.adDuration || '');
    setEventTierOptions(tierOptions);
    setAudienceOptions(audienceOpts);
    const savedTierRates = pricing?.type === 'event_tier' ? (pricing.ratesByTier || {}) : {};
    const nextRates = {};
    tierOptions.forEach((tier) => { nextRates[tier] = savedTierRates[tier] || ''; });
    setEventTierRates(nextRates);
    setEventTierInputValue('');
    setSlotDurationInputValue('');
    setAdDurationInputValue('');
    setAudienceInputValue('');
    setAdTypeInputValue('');
    setAddOpen(true);
  };

  const addCreatableOption = (rawValue, currentOptions, setOptions, setRates, duplicateMessage) => {
    const value = String(rawValue || '').trim();
    if (!value) return null;
    const exists = currentOptions.some((x) => String(x).toLowerCase() === value.toLowerCase());
    if (exists) {
      // If it exists, we just return the normalized value instead of erroring
      // This handles the case where Autocomplete onChange is triggered on existing selection
      setAddError('');
      return currentOptions.find((x) => String(x).toLowerCase() === value.toLowerCase()) || value;
    }
    setOptions((prev) => Array.from(new Set([...prev, value])));
    setRates((prev) => ({ ...prev, [value]: '' }));
    setAddError('');
    return value;
  };

  const handleCreateService = async () => {
    const triggerError = (msg) => {
      setAddError(msg);
      setIsSaving(false);
      formScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (!newService.category || !newService.title) {
      triggerError('Category and Title are required.');
      return;
    }
    if (newService.category === 'Online Advertising') {
      const link = String(newService.subtitle || '').trim();
      if (!link) {
        triggerError('App or Site Link is required for Online Advertising.');
        return;
      }
      if (!link.includes('.') || link.includes(' ')) {
        triggerError('Please enter a valid App or Site link (e.g., https://arcads.com).');
        return;
      }
    }
    
    if (!Array.isArray(newService.images) || newService.images.length === 0) {
      triggerError('At least one image is required.');
      return;
    }

    if (!newService.availableFrom || !newService.availableTo) {
      triggerError('Please provide service availability period.');
      return;
    }
    if (newService.availableFrom < minAvailableDateStr || newService.availableTo < minAvailableDateStr) {
      triggerError('"Available From" and "Ending On" dates must be at least the day after tomorrow.');
      return;
    }
    if (new Date(newService.availableFrom) > new Date(newService.availableTo)) {
      triggerError('Availability end date should be after start date.');
      return;
    }

    const duplicateTitle = allServices.find((svc) =>
      svc.isCustom
      && String(svc.category || '').toLowerCase() === String(newService.category).toLowerCase()
      && String(svc.title || '').trim().toLowerCase() === String(newService.title).trim().toLowerCase()
      && (!isEditMode || String(svc.id) !== String(editingServiceId))
    );
    if (duplicateTitle) {
      triggerError('A service with this title already exists in this category.');
      return;
    }

    const missingRequirement = requiredCriteria.find((req) => {
      const val = criteriaValues[req.key];
      return val === undefined || val === null || String(val).trim() === '';
    });
    if (missingRequirement) {
      triggerError(`Please fill category criteria: ${missingRequirement.label}.`);
      return;
    }

    const rate = Number(pricingConfig.rate);
    if (!isTvCategory && !isEventCategory && (!Number.isFinite(rate) || rate <= 0)) {
      triggerError('Please provide a valid price rate.');
      return;
    }
    if (isTvCategory) {
      if (tvTimingOptions.length === 0) {
        triggerError('Please add at least one timing option.');
        return;
      }
      const missingTvRate = tvTimingOptions.find((opt) => {
        const v = Number(tvTimeRates[opt]);
        return !Number.isFinite(v) || v <= 0;
      });
      if (missingTvRate) {
        triggerError(`Please set hourly price for "${missingTvRate}".`);
        return;
      }
    }
    if (isEventCategory) {
      if (eventTierOptions.length === 0) {
        triggerError('Please add at least one sponsorship tier.');
        return;
      }
      const missingTierRate = eventTierOptions.find((tier) => {
        const v = Number(eventTierRates[tier]);
        return !Number.isFinite(v) || v <= 0;
      });
      if (missingTierRate) {
        triggerError(`Please add valid price for "${missingTierRate}".`);
        return;
      }
    }

    setIsSaving(true);
    setAddError('');
    const autoUnitFieldKey = numericCategoryRequirements[0]?.key || '';
    const effectivePricingType = (!isTvCategory
      && !isEventCategory
      && (pricingConfig.type === 'per_day' || pricingConfig.type === 'per_quantity')
      && !autoUnitFieldKey)
      ? 'fixed'
      : pricingConfig.type;


    const payload = {
      category: newService.category,
      title: newService.title.trim(),
      subtitle: newService.subtitle.trim(),
      description: newService.description.trim(),
      image: String(newService.images[0] || '').trim(),
      images: newService.images,
      availableFrom: newService.availableFrom,
      availableTo: newService.availableTo,
      examples: [],
      features: [],
      criteriaValues,
      bookingFields: isEventCategory
        ? selectedCategoryRequirements.map((f) => {
          if (f.key === 'tier') return { ...f, options: eventTierOptions };
          return f;
        })
        : isMallCategory
          ? selectedCategoryRequirements.map((f) => (f.key === 'slotDuration' ? { ...f, options: slotDurationOptions } : f))
          : isTvCategory
            ? selectedCategoryRequirements.map((f) => (f.key === 'adDuration' ? { ...f, type: 'number' } : f))
            : isOnlineAdCategory
              ? selectedCategoryRequirements.map((f) => {
                if (f.key === 'audience') return { ...f, options: audienceOptions };
                if (f.key === 'adType') return { ...f, options: adTypeOptions };
                return f;
              })
              : selectedCategoryRequirements,
      pricingConfig: isEventCategory
        ? {
          type: 'event_tier',
          ratesByTier: eventTierRates,
          tierFieldKey: 'tier',
        }
        : isTvCategory
          ? {
            type: 'tv_time_hourly',
            ratesByPreference: tvTimeRates,
            preferenceFieldKey: 'timePreference',
            hoursFieldKey: 'hours',
          }
          : {
            type: effectivePricingType,
            rate,
            unitFieldKey: effectivePricingType === 'fixed' ? '' : autoUnitFieldKey,
          },
    };

    const formData = new FormData();
    formData.append('category', payload.category);
    formData.append('title', payload.title);
    formData.append('subtitle', payload.subtitle);
    formData.append('description', payload.description);
    formData.append('availableFrom', payload.availableFrom);
    formData.append('availableTo', payload.availableTo);
    formData.append('criteriaValues', JSON.stringify(payload.criteriaValues));
    formData.append('bookingFields', JSON.stringify(payload.bookingFields));
    formData.append('pricingConfig', JSON.stringify(payload.pricingConfig));

    const existingImages = [];
    (newService.images || []).forEach((img) => {
      if (img instanceof File) {
        formData.append('images', img);
      } else if (typeof img === 'string') {
        existingImages.push(img);
      }
    });
    formData.append('existingImages', JSON.stringify(existingImages));

    let savedService = null;
    try {
      if (isEditMode && editingServiceId) {
        savedService = await updateCustomAdServiceToApi(editingServiceId, formData);
      } else {
        savedService = await addCustomAdServiceToApi(formData);
      }

      // FIRST: close the dialog immediately
      setAddOpen(false);
      
      // THEN: do the rest of the updates
      resetForm(newService.category);

      const rows = await fetchCustomAdServicesFromApi();
      setCustomServices(Array.isArray(rows) ? rows : []);

      setRefreshTick((x) => x + 1);
      setActiveCategory(newService.category);
      setAddError('');
    } catch (err) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message;
      const message = status === 413
        ? 'Upload is too large. Please reduce image/video size or upload fewer files.'
        : apiMessage || err?.message || 'Failed to save service.';
      setAddError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvailableFromChange = (value) => {
    if (!value) {
      setNewService((prev) => ({ ...prev, availableFrom: value }));
      setDateError('Available From is required.');
      return;
    }
    if (value < minAvailableDateStr) {
      setDateError('"Available From" date must be at least the day after tomorrow.');
      return;
    }
    setNewService((prev) => {
      const nextTo = prev.availableTo && prev.availableTo < value ? value : prev.availableTo;
      return { ...prev, availableFrom: value, availableTo: nextTo };
    });
    setDateError('');
  };

  const handleAvailableToChange = (value) => {
    if (!value) {
      setNewService((prev) => ({ ...prev, availableTo: value }));
      setDateError('Available To is required.');
      return;
    }
    // Rule: Must be >= Available From AND >= minAvailableDateStr (Day after tomorrow)
    const minFrom = newService.availableFrom || (!isEditMode ? minAvailableDateStr : '');
    const finalMinTo = minFrom > minAvailableDateStr ? minFrom : minAvailableDateStr;

    if (value < finalMinTo) {
      if (value < minFrom) {
        setDateError('Available To cannot be before Available From.');
      } else {
        setDateError(`Available To must be at least from ${minAvailableDateStr} (Day after tomorrow).`);
      }
      return;
    }
    setNewService((prev) => ({ ...prev, availableTo: value }));
    setDateError('');
  };

  const handleThumbnailUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const existingCount = (newService.images || []).length;
    if (existingCount + files.length > MAX_MEDIA_FILES) {
      setAddError(`You can upload up to ${MAX_MEDIA_FILES} media files only.`);
      return;
    }
    const invalidMedia = files.find((f) => !f.type.startsWith('image/') && !f.type.startsWith('video/'));
    if (invalidMedia) {
      setAddError('Please select only image or video files.');
      return;
    }
    const oversized = files.find((f) => (f.size / (1024 * 1024)) > MAX_SINGLE_FILE_MB);
    if (oversized) {
      setAddError(`Each file must be <= ${MAX_SINGLE_FILE_MB}MB. Oversized: ${oversized.name}`);
      return;
    }
    const incomingMb = files.reduce((sum, f) => sum + (f.size / (1024 * 1024)), 0);
    const existingApproxMb = (newService.images || []).reduce((sum, x) => sum + (String(x || '').length * 0.000001), 0);
    if (incomingMb + existingApproxMb > MAX_TOTAL_MEDIA_MB) {
      setAddError(`Total media payload is too large. Keep combined upload under ${MAX_TOTAL_MEDIA_MB}MB.`);
      return;
    }
    setAddError('');
    setNewService((prev) => {
      const merged = [...(prev.images || []), ...files].filter(Boolean);
      return { ...prev, images: merged, image: merged[0] || '' };
    });
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <CampaignIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Ad Services</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage advertising services offered to advertisers
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Service Catalog" />
        <Tab label="Inquiries / Bookings" />
      </Tabs>

      {tab === 0 && (
        <>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Each advertising category has separate requirements. Click a category card to view its service cards and requirement fields.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Saved ad packages: {customServices.length}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const category = newService.category || categories[0] || '';
                setNewService((prev) => ({ ...prev, category }));
                initializeCriteriaValues(category);
                setIsEditMode(false);
                setEditingServiceId(null);
                setAddError('');
                setDateError('');
                setAddOpen(true);
              }}
              sx={{ borderRadius: 2 }}
            >
              Add Ad Service
            </Button>
          </Stack>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {categories.map((category) => {
              const template = getCategoryTemplate(category);
              const customCount = customServices.filter(
                (svc) => normalizeCategory(svc.category) === normalizeCategory(category),
              ).length;
              return (
                <Grid item xs={12} sm={6} lg={4} key={category}>
                  <Card
                    variant="outlined"
                    onClick={() => {
                      setActiveCategory(category);
                      setTimeout(() => {
                        servicePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      borderColor: activeCategory === category ? template?.color : 'divider',
                      boxShadow: activeCategory === category ? 4 : 0,
                      transition: 'all .2s',
                    }}
                  >
                    <CardMedia component="img" height="140" image={template?.image} alt={category} sx={{ objectFit: 'cover' }} />
                    <Box sx={{ height: 5, bgcolor: template?.color }} />
                    <CardContent>
                      <Typography variant="h6" fontWeight={700}>{category}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip size="small" color="primary" label={`${customCount} added`} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {activeCategory && (
            <Paper ref={servicePanelRef} variant="outlined" sx={{ p: 2.5, borderRadius: 3, scrollMarginTop: 80 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{activeCategory}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only packages you add below appear to advertisers (category overview cards are separate).
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewService((prev) => ({ ...prev, category: activeCategory }));
                    initializeCriteriaValues(activeCategory);
                    setIsEditMode(false);
                    setEditingServiceId(null);
                    setCustomTimingLabel('');
                    setAddError('');
                    setDateError('');
                    setAddOpen(true);
                  }}
                >
                  Add in this Category
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Added Services</Typography>
                <TextField
                  size="small"
                  placeholder="Search added services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  sx={{ minWidth: { xs: '100%', sm: 280 } }}
                />
              </Stack>
              {activeCategoryServices.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No saved packages in this category yet. Use &quot;Add in this Category&quot; to create one.</Typography>
              ) : filteredActiveCategoryServices.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No services match your search.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {filteredActiveCategoryServices.map((svc) => (
                    <Grid item xs={12} sm={6} md={4} key={svc.id}>
                      <AdminServiceCard
                        svc={svc}
                        openEditDialog={openEditDialog}
                        setPreviewImages={setPreviewImages}
                        setPreviewImageIdx={setPreviewImageIdx}
                        setPreviewImage={setPreviewImage}
                        onDelete={handleDeleteClick}
                        onToggleActive={handleToggleActive}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Box sx={{ mb: 3 }}>
            <TextField
              size="small"
              placeholder="Search incoming inquiries..."
              value={inquirySearch}
              onChange={(e) => setInquirySearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280, maxWidth: 400 }}
            />
          </Box>
          
          {loadingInquiries ? (
            <Typography color="text.secondary">Loading inquiries…</Typography>
          ) : inquiries.filter(i => 
              !inquirySearch || 
              (i.serviceTitle && i.serviceTitle.toLowerCase().includes(inquirySearch.toLowerCase())) ||
              (i.User?.name && i.User.name.toLowerCase().includes(inquirySearch.toLowerCase())) ||
              (i.User?.email && i.User.email.toLowerCase().includes(inquirySearch.toLowerCase()))
            ).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <InboxIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {inquirySearch ? 'No matches found' : 'No inquiries yet'}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {inquirySearch ? 'Try a different search term.' : 'Inquiries from advertisers will appear here once they submit a booking request.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Advertiser</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquiries.filter(i => 
                  !inquirySearch || 
                  (i.serviceTitle && i.serviceTitle.toLowerCase().includes(inquirySearch.toLowerCase())) ||
                  (i.User?.name && i.User.name.toLowerCase().includes(inquirySearch.toLowerCase())) ||
                  (i.User?.email && i.User.email.toLowerCase().includes(inquirySearch.toLowerCase()))
                ).map((inq) => (
                  <TableRow key={inq.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{inq.serviceTitle || inq.serviceId}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{inq.User?.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{inq.User?.email || ''}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {inq.status === 'pending' ? (
                          <Stack direction="row" spacing={1}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              onClick={() => handleInquiryStatusChange(inq.id, 'confirmed')}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleInquiryStatusChange(inq.id, 'rejected')}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        ) : (
                          <Chip
                            label={String(inq.status).toUpperCase()}
                            size="small"
                            color={inq.status === 'confirmed' ? 'success' : 'error'}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        )}
                        {inq.isResubmitted && (
                          <Chip 
                            label="RE-SUBMITTED" 
                            size="small" 
                            variant="outlined" 
                            color="secondary"
                            sx={{ 
                              fontSize: '0.65rem', 
                              height: 20, 
                              fontWeight: 800, 
                              borderColor: 'secondary.main',
                              color: 'secondary.light',
                              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)'
                            }} 
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setInquiryDetailOpen(true);
                        }}
                        startIcon={<VisibilityIcon sx={{ fontSize: '1.1rem' }} />}
                        sx={{ 
                          textTransform: 'none',
                          fontWeight: 800,
                          borderRadius: 2,
                          px: 2,
                          py: 0.8,
                          bgcolor: (theme) => `${theme.palette.primary.main}10`,
                          color: 'primary.main',
                          border: '1px solid transparent',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selected.title} — Requirements</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Category-specific fields advertisers will fill:
              </Typography>
              <Stack spacing={1.5}>
                {(selected.bookingFields || []).map((f) => (
                  <Paper key={f.key} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>{f.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {f.type === 'select' ? `Dropdown — ${(f.options || []).join(' / ')}` : f.type === 'date' ? 'Date picker' : `Input — "${f.placeholder || ''}"`}
                    </Typography>
                    {selected.criteriaValues?.[f.key] ? (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Configured: {selected.criteriaValues[f.key]}
                      </Typography>
                    ) : null}
                  </Paper>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)} variant="contained">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      <Dialog open={inquiryDetailOpen} onClose={() => setInquiryDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="h6" fontWeight={800}>Booking Details</Typography>
                {selectedInquiry.isResubmitted && (
                  <Chip 
                    label="RE-SUBMITTED" 
                    size="small" 
                    color="secondary"
                    sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }} 
                  />
                )}
              </Stack>
              <IconButton onClick={() => setInquiryDetailOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 3 }}>
              <Stack spacing={4}>
                {/* Section: Service & Advertiser */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>SERVICE</Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ mb: 2 }}>{selectedInquiry.serviceTitle || selectedInquiry.serviceId}</Typography>
                  
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>ADVERTISER</Typography>
                  <Typography variant="h6" fontWeight={700}>{selectedInquiry.User?.name || 'Unknown'}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedInquiry.User?.email}</Typography>
                </Box>

                {/* Section: Submitted Information */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon fontSize="small" color="primary" />
                    Submitted Information
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 2.5, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)', // Glass effect
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Stack spacing={2}>
                      {[
                        { key: 'adTitle', altKey: 'title', label: 'Title' },
                        { key: 'platform', label: 'Platform' },
                        { key: 'campaignDescription', altKey: 'description', extraKey: 'additionalDetails', label: 'Description' },
                        { key: 'from', label: 'Travel From' },
                        { key: 'to', label: 'Travel To' },
                        { key: 'targetAudience', altKey: 'audience', label: 'Target Audience' },
                        { key: 'adType', label: 'Ad Type' },
                        { key: 'startDate', label: 'Start Date' },
                        { key: 'endDate', label: 'End Date' },
                      ].map((f) => {
                        const val = selectedInquiry.formData?.[f.key] || 
                                    selectedInquiry.formData?.[f.altKey] || 
                                    (f.extraKey ? selectedInquiry.formData?.[f.extraKey] : null);
                        
                        // If given logic for optional fields
                        const isOptional = f.key === 'campaignDescription' || f.key === 'targetAudience';
                        if (!val && isOptional) return null;
                        if (!val && f.key !== 'startDate' && f.key !== 'endDate' && f.key !== 'from' && f.key !== 'to') return null;
                        
                        let displayVal = String(val || '—');
                        if (f.key.toLowerCase().includes('date') && val) {
                          displayVal = dayjs(val).format(DISPLAY_DATE_FORMAT);
                        }

                        return (
                          <Box key={f.key}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.2 }}>{f.label}:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{displayVal}</Typography>
                          </Box>
                        );
                      })}
                      
                      {/* Duration Calculation */}
                      {selectedInquiry.formData?.startDate && selectedInquiry.formData?.endDate && (
                        <Box 
                          sx={{ 
                            mt: 1, 
                            p: 1.5, 
                            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}40)`,
                            borderRadius: 1.5, 
                            border: '1px solid',
                            borderColor: 'primary.main',
                            color: 'primary.light'
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.primary', opacity: 0.9, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Campaign Duration</Typography>
                          <Typography variant="body2" fontWeight={800} color="primary.light">
                            {dayjs(selectedInquiry.formData.endDate).diff(dayjs(selectedInquiry.formData.startDate), 'day') + 1} Days
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>

                {/* Section: Media */}
                {selectedInquiry.formData?.mediaUrl && (
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CampaignIcon fontSize="small" color="primary" />
                        Uploaded Media
                      </Typography>
                      <Button
                        size="small"
                        component="a"
                        href={selectedInquiry.formData.mediaUrl}
                        download={selectedInquiry.formData.mediaName || 'campaign-media'}
                        startIcon={<GetAppIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                        variant="outlined"
                      >
                        Download
                      </Button>
                    </Stack>
                    <Box sx={{ position: 'relative', borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'black', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {checkIfVideo(selectedInquiry.formData.mediaUrl) ? (
                        <video 
                          src={selectedInquiry.formData.mediaUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: 300 }} 
                        />
                      ) : (
                        <img 
                          src={selectedInquiry.formData.mediaUrl} 
                          alt="Campaign"
                          style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} 
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Section: Payment Details Summary Box */}
                <Box sx={{ p: 0.5 }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.main}10, ${theme.palette.secondary.main}25)`,
                      border: '1px solid',
                      borderColor: 'secondary.main',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={900} color="secondary.light" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaidIcon />
                      Payment Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>ADVERTISER</Typography>
                        <Typography variant="body2" fontWeight={700} color="text.primary">{selectedInquiry.User?.name || '—'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        { (selectedInquiry.formData?.paymentMethod === 'card' || selectedInquiry.formData?.cardNumber) ? (
                          <>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CreditCardIcon sx={{ fontSize: 14 }} /> CARD PAYMENT
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                              {selectedInquiry.formData?.cardHolder || selectedInquiry.formData?.cardHolderName || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                              {selectedInquiry.formData?.cardNumber 
                                ? `xxxx xxxx xxxx ${selectedInquiry.formData.cardNumber.slice(-4)}` 
                                : 'xxxx xxxx xxxx —'
                              }
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>TRANSACTION ID (UTR)</Typography>
                            <Typography variant="body2" fontWeight={700} color="text.primary">{selectedInquiry.formData?.upiId || '—'}</Typography>
                          </>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1.5, borderColor: 'secondary.dark', opacity: 0.3 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '1rem' }}>TOTAL AMOUNT</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="h5" fontWeight={900} color="secondary.light">
                          ₹{Number(selectedInquiry.totalAmount || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              {['pending', 'confirmed'].includes(selectedInquiry.status) ? (
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  {selectedInquiry.status === 'pending' && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={() => {
                        handleInquiryStatusChange(selectedInquiry.id, 'confirmed');
                        setInquiryDetailOpen(false);
                      }}
                      sx={{ height: 48, borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
                    >
                      Accept Booking
                    </Button>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      handleInquiryStatusChange(selectedInquiry.id, 'rejected');
                      setInquiryDetailOpen(false);
                    }}
                    sx={{ height: 48, borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
                  >
                    Reject Booking
                  </Button>
                </Stack>
              ) : (
                <Button 
                  onClick={() => setInquiryDetailOpen(false)} 
                  variant="contained" 
                  fullWidth 
                  sx={{ height: 44, borderRadius: 2, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{isEditMode ? 'Edit Ad Service' : 'Add New Ad Service'}</DialogTitle>
        <DialogContent dividers>
          <Box ref={formScrollRef} sx={{ height: 1, position: 'absolute', top: 0 }} />
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {addError && <Alert severity="error">{addError}</Alert>}
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newService.category}
                label="Category"
                onChange={(e) => {
                  const category = e.target.value;
                  setNewService((prev) => ({ ...prev, category }));
                  initializeCriteriaValues(category);
                }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {newService.category === 'Online Advertising' && (
              <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                <InputLabel>Platform</InputLabel>
                <Select
                  label="Platform"
                  value={criteriaValues.platform || ''}
                  onChange={(e) => setCriteriaValues((prev) => ({ ...prev, platform: e.target.value }))}
                >
                  <MenuItem value="Website">Website</MenuItem>
                  <MenuItem value="App">App</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField size="small" label="Service Title" value={newService.title} onChange={(e) => setNewService((prev) => ({ ...prev, title: e.target.value }))} fullWidth />
            <TextField
              size="small"
              label={newService.category === 'Online Advertising' ? 'App or Site Link' : 'Subtitle'}
              value={newService.subtitle}
              onChange={(e) => setNewService((prev) => ({ ...prev, subtitle: e.target.value }))}
              fullWidth
              required={newService.category === 'Online Advertising'}
            />
            <TextField size="small" label="Description" value={newService.description} onChange={(e) => setNewService((prev) => ({ ...prev, description: e.target.value }))} fullWidth multiline minRows={2} />
            {newService.category === 'Transportation Advertising' && (
              <Stack direction="row" spacing={2}>
                <TextField 
                  size="small" label="Travel From" fullWidth 
                  value={criteriaValues.from || ''} 
                  onChange={(e) => setCriteriaValues(p => ({ ...p, from: e.target.value }))} 
                />
                <TextField 
                  size="small" label="Travel To" fullWidth 
                  value={criteriaValues.to || ''} 
                  onChange={(e) => setCriteriaValues(p => ({ ...p, to: e.target.value }))} 
                />
              </Stack>
            )}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                borderRadius: 3, 
                bgcolor: 'rgba(255, 255, 255, 0.04)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 2,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle accent glow */}
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, bgcolor: 'primary.main', opacity: 0.05, filter: 'blur(30px)', borderRadius: '50%' }} />
              
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography 
                  variant="caption" 
                  fontWeight={800} 
                  color="primary.main" 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1.2, textTransform: 'uppercase' }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 18 }} /> Availability Period
                </Typography>
                
                {newService.availableFrom && newService.availableTo && !dayjs(newService.availableTo).isBefore(dayjs(newService.availableFrom)) && (
                  <Chip 
                    label={`${dayjs(newService.availableTo).diff(dayjs(newService.availableFrom), 'day') + 1} Days Duration`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.65rem', bgcolor: (theme) => `${theme.palette.primary.main}10` }}
                  />
                )}
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  label="Starting From"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: minAvailableDateStr }}
                  value={newService.availableFrom}
                  onChange={(e) => handleAvailableFromChange(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }
                  }}
                />
                
                <Box sx={{ display: { xs: 'none', md: 'flex' }, color: 'text.disabled', opacity: 0.5 }}>
                  <ArrowForwardIcon sx={{ fontSize: 20 }} />
                </Box>

                <TextField
                  size="small"
                  fullWidth
                  label="Ending On"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: newService.availableFrom > minAvailableDateStr ? newService.availableFrom : minAvailableDateStr 
                  }}
                  value={newService.availableTo}
                  onChange={(e) => handleAvailableToChange(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }
                  }}
                />
              </Stack>
            </Paper>
            {dateError && <Alert severity="warning">{dateError}</Alert>}
            <Box>
              <Button variant="outlined" component="label" fullWidth sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                {newService.images?.length ? 'Add More Media' : 'Upload Service Media (Images/Videos)'}
                <input type="file" accept="image/*,video/*" multiple hidden onChange={handleThumbnailUpload} />
              </Button>
              {newService.images?.length > 0 && (
                <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 1 }}>
                  {newService.images.map((img, idx) => {
                    const isFile = img instanceof File;
                    const url = isFile ? URL.createObjectURL(img) : img;
                    const isVideo = isFile ? img.type.startsWith('video/') : checkIfVideo(img);
                    return (
                      <Box key={isFile ? `${idx}-${img.name}` : `${idx}-${String(img).slice(-12)}`} sx={{ position: 'relative' }}>
                        {isVideo ? (
                          <Box
                            component="video"
                            src={url}
                            preload="metadata"
                            onLoadedMetadata={(e) => { e.target.currentTime = 0.5; }}
                            onClick={() => setPreviewImage(url)}
                            sx={{ width: '100%', height: 74, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'zoom-in', bgcolor: '#000' }}
                            muted
                          />
                        ) : (
                          <Box
                            component="img"
                            src={url}
                            alt={`Service preview ${idx + 1}`}
                            onClick={() => setPreviewImage(url)}
                            sx={{ width: '100%', height: 74, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'zoom-in' }}
                          />
                        )}
                        <Button
                          size="small"
                          color="error"
                          sx={{ minWidth: 0, px: 0.7, position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.92)' }}
                          onClick={() => setNewService((prev) => {
                            const next = (prev.images || []).filter((_, i) => i !== idx);
                            return { ...prev, images: next, image: next[0] || '' };
                          })}
                        >
                          x
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              )}

            </Box>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Pricing Setup</Typography>
              {isTvCategory ? (
                <Stack spacing={1.2}>
                  <Alert severity="info">Set hourly price for each time preference.</Alert>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Add Custom Timing"
                      placeholder="e.g. Late Night (11 PM - 2 AM)"
                      value={customTimingLabel}
                      onChange={(e) => setCustomTimingLabel(e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const key = customTimingLabel.trim();
                        if (!key) return;
                        if (tvTimeRates[key] !== undefined) {
                          setAddError('This timing already exists.');
                          return;
                        }
                        setTvTimeRates((prev) => ({ ...prev, [key]: '' }));
                        setCustomTimingLabel('');
                        setAddError('');
                      }}
                    >
                      Add Timing
                    </Button>
                  </Stack>
                  {tvTimePreferences.map((opt) => (
                    <TextField
                      key={opt}
                      size="small"
                      type="number"
                      label={`${opt} - Price per hour (Rs)`}
                      value={tvTimeRates[opt] || ''}
                      onChange={(e) => setTvTimeRates((prev) => ({ ...prev, [opt]: e.target.value }))}
                      fullWidth
                      inputProps={{ min: 0, step: 1 }}
                    />
                  ))}
                  {tvTimingOptions.filter((opt) => !tvTimePreferences.includes(opt)).map((opt) => (
                    <Stack key={`custom-rate-${opt}`} direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        type="number"
                        label={`${opt} - Price per hour (Rs)`}
                        value={tvTimeRates[opt] || ''}
                        onChange={(e) => setTvTimeRates((prev) => ({ ...prev, [opt]: e.target.value }))}
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                      />
                      <Button
                        color="error"
                        onClick={() => setTvTimeRates((prev) => {
                          const next = { ...prev };
                          delete next[opt];
                          return next;
                        })}
                      >
                        Remove
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : isEventCategory ? (
                <Stack spacing={1.2}>
                  <Alert severity="info">Set individual pricing for each sponsorship tier and event type.</Alert>
                  <Autocomplete
                    freeSolo
                    options={eventTierOptions}
                    value={criteriaValues.tier || null}
                    inputValue={eventTierInputValue}
                    onChange={(_, value) => {
                      if (typeof value === 'string') {
                        const created = addCreatableOption(
                          value,
                          eventTierOptions,
                          setEventTierOptions,
                          setEventTierRates,
                          'This sponsorship tier already exists.',
                        );
                        if (created) {
                          upsertAdServiceOptionToApi({
                            category: 'Event & Sponsorship Advertising',
                            fieldKey: 'tier',
                            optionValue: created,
                          }).catch(() => {});
                          setCriteriaValues((prev) => ({ ...prev, tier: created }));
                          setEventTierInputValue('');
                        }
                        return;
                      }
                      setCriteriaValues((prev) => ({ ...prev, tier: value || '' }));
                      setEventTierInputValue(value || '');
                    }}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'reset') return;
                      setEventTierInputValue(value || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Sponsorship Tier"
                        placeholder="Select or type a new tier and press Enter"
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          const created = addCreatableOption(
                            eventTierInputValue,
                            eventTierOptions,
                            setEventTierOptions,
                            setEventTierRates,
                            'This sponsorship tier already exists.',
                          );
                            if (created) {
                              setCriteriaValues((prev) => ({ ...prev, tier: created }));
                              setEventTierInputValue('');
                            }
                            e.preventDefault();
                        }}
                      />
                    )}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={() => {
                      const created = addCreatableOption(
                        eventTierInputValue,
                        eventTierOptions,
                        setEventTierOptions,
                        setEventTierRates,
                        'This sponsorship tier already exists.',
                      );
                      if (created) {
                        setCriteriaValues((prev) => ({ ...prev, tier: created }));
                        setEventTierInputValue('');
                      }
                    }}
                  >
                    Add New Sponsorship Tier
                  </Button>
                  {eventTierOptions.length > 0 && (
                    <Stack direction="row" gap={0.8} flexWrap="wrap">
                      {eventTierOptions.map((opt) => (
                        <Chip
                          key={opt}
                          size="small"
                          label={opt}
                          onDelete={() => {
                            setEventTierOptions((prev) => prev.filter((x) => x !== opt));
                            setEventTierRates((prev) => {
                              const next = { ...prev };
                              delete next[opt];
                              return next;
                            });
                            setCriteriaValues((prev) => (prev.tier === opt ? { ...prev, tier: '' } : prev));
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                  {eventTierOptions.map((tier) => (
                    <TextField
                      key={`tier-rate-${tier}`}
                      size="small"
                      type="number"
                      label={`${tier} - Price (Rs)`}
                      value={eventTierRates[tier] || ''}
                      onChange={(e) => setEventTierRates((prev) => ({ ...prev, [tier]: e.target.value }))}
                      fullWidth
                      inputProps={{ min: 0, step: 1 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={1.2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Pricing Type</InputLabel>
                    <Select
                      value={pricingConfig.type}
                      label="Pricing Type"
                      onChange={(e) => setPricingConfig((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem value="fixed">Fixed Total</MenuItem>
                      <MenuItem value="per_day">Per Day</MenuItem>
                      <MenuItem value="per_quantity">Per Quantity</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    label={pricingConfig.type === 'fixed' ? 'Total Price (Rs)' : 'Rate (Rs)'}
                    value={pricingConfig.rate}
                    onChange={(e) => setPricingConfig((prev) => ({ ...prev, rate: e.target.value }))}
                    fullWidth
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Stack>
              )}
            </Paper>
            <Box>
              <Stack spacing={1.2}>
                {criteriaRequirements
                  .filter((f) => !(isEventCategory && (f.key === 'eventType' || f.key === 'tier')))
                  .map((f) => (
                  f.type === 'select' ? (
                    <FormControl key={f.key} size="small" fullWidth>
                      <InputLabel>{f.label}</InputLabel>
                      <Select
                        value={criteriaValues[f.key] || ''}
                        label={f.label}
                        onChange={(e) => setCriteriaValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      >
                        {((isTvCategory && f.key === 'timePreference')
                          ? tvTimingOptions
                          : (isEventCategory && f.key === 'tier')
                            ? eventTierOptions
                            : (isMallCategory && f.key === 'slotDuration')
                              ? slotDurationOptions
                            : (f.options || [])).map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      key={f.key}
                      size="small"
                      fullWidth
                      label={f.label}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      placeholder={f.placeholder || ''}
                      InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                      inputProps={f.type === 'date' ? { min: todayStr } : undefined}
                      value={criteriaValues[f.key] || ''}
                      onChange={(e) => setCriteriaValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  )
                ))}
                {isMallCategory && (
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    label="Ad Slot Duration"
                    value={criteriaValues.slotDuration ? String(criteriaValues.slotDuration).replace(/[^0-9]/g, '') : ''}
                    onChange={(e) => setCriteriaValues((prev) => ({ ...prev, slotDuration: e.target.value ? `${e.target.value} sec` : '' }))}
                    placeholder="e.g., 30"
                    inputProps={{ min: 1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>
                    }}
                  />
                )}
                {isTvCategory && (
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    label="Ad Duration"
                    value={criteriaValues.adDuration ? String(criteriaValues.adDuration).replace(/[^0-9]/g, '') : ''}
                    onChange={(e) => setCriteriaValues((prev) => ({ ...prev, adDuration: e.target.value ? `${e.target.value} sec` : '' }))}
                    placeholder="e.g., 30"
                    inputProps={{ min: 1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>
                    }}
                  />
                )}
                {isOnlineAdCategory && (
                  <>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: -1 }}>Ad Type Options</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Type a value and press Add..."
                        value={adTypeInputValue}
                        onChange={(e) => setAdTypeInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const v = adTypeInputValue.trim();
                          if (!v || adTypeOptions.some(x => x.toLowerCase() === v.toLowerCase())) return;
                          setAdTypeOptions(prev => [...prev, v]);
                          setAdTypeInputValue('');
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const v = adTypeInputValue.trim();
                          if (!v || adTypeOptions.some(x => x.toLowerCase() === v.toLowerCase())) return;
                          setAdTypeOptions(prev => [...prev, v]);
                          setAdTypeInputValue('');
                        }}
                      >
                        Add
                      </Button>
                    </Stack>
                    {adTypeOptions.length > 0 && (
                      <Stack direction="row" gap={0.8} flexWrap="wrap">
                        {adTypeOptions.map((opt) => (
                          <Chip
                            key={opt}
                            size="small"
                            label={opt}
                            onDelete={() => setAdTypeOptions(prev => prev.filter(x => x !== opt))}
                          />
                        ))}
                      </Stack>
                    )}
                  </>
                )}
                {isOnlineAdCategory && (
                  <>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: -1 }}>Target Audience Options</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Type a value and press Add..."
                        value={audienceInputValue}
                        onChange={(e) => setAudienceInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const v = audienceInputValue.trim();
                          if (!v || audienceOptions.some(x => x.toLowerCase() === v.toLowerCase())) return;
                          setAudienceOptions(prev => [...prev, v]);
                          setAudienceInputValue('');
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const v = audienceInputValue.trim();
                          if (!v || audienceOptions.some(x => x.toLowerCase() === v.toLowerCase())) return;
                          setAudienceOptions(prev => [...prev, v]);
                          setAudienceInputValue('');
                        }}
                      >
                        Add
                      </Button>
                    </Stack>
                    {audienceOptions.length > 0 && (
                      <Stack direction="row" gap={0.8} flexWrap="wrap">
                        {audienceOptions.map((opt) => (
                          <Chip
                            key={opt}
                            size="small"
                            label={opt}
                            onDelete={() => setAudienceOptions(prev => prev.filter(x => x !== opt))}
                          />
                        ))}
                      </Stack>
                    )}
                  </>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateService} 
            variant="contained" 
            disabled={isSaving || (isEditMode && !isDirty) || !allRequirementsFilled || !!addError}
          >
            {isSaving ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Service')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => !isDeleting && setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" /> Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{serviceToDelete?.title}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. Inquiries associated with this service will remain but might show incomplete service data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleDeleteService} variant="contained" color="error" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewImage)} onClose={() => { setPreviewImage(''); setPreviewImages([]); setPreviewImageIdx(0); }} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1 }}>
          {previewImage && (
            <>
              {checkIfVideo(previewImage) ? (
                <Box component="video" src={resolveUploadUrl(previewImage)} controls autoPlay sx={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 1, bgcolor: '#000' }} />
              ) : (
                <Box component="img" src={resolveUploadUrl(previewImage)} alt="Preview" sx={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 1 }} />
              )}
              {previewImages.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.2, overflowX: 'auto' }}>
                  {previewImages.map((img, idx) => (
                    checkIfVideo(img) ? (
                      <Box
                        key={`preview-img-${idx}`}
                        component="video"
                        src={resolveUploadUrl(img)}
                        onClick={() => { setPreviewImageIdx(idx); setPreviewImage(img); }}
                        sx={{
                          width: 96,
                          height: 68,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: idx === previewImageIdx ? 'primary.main' : 'transparent',
                          bgcolor: '#000',
                        }}
                        muted
                      />
                    ) : (
                      <Box
                        key={`preview-img-${idx}`}
                        component="img"
                        src={resolveUploadUrl(img)}
                        alt={`Preview ${idx + 1}`}
                        onClick={() => { setPreviewImageIdx(idx); setPreviewImage(img); }}
                        sx={{
                          width: 96,
                          height: 68,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: idx === previewImageIdx ? 'primary.main' : 'transparent',
                        }}
                      />
                    )
                  ))}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
