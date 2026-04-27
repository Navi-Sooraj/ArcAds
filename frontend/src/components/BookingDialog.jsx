import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../utils/dateConstants';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Tabs,
  Tab,
  InputAdornment,
  Stack,
} from '@mui/material';
import CreditCard from '@mui/icons-material/CreditCard';
import Book from '@mui/icons-material/Book';
import Visibility from '@mui/icons-material/Visibility';
import EventBusy from '@mui/icons-material/EventBusy';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { checkIfVideo } from '../utils/mediaUrl';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingOccupiedDatePickers from './BookingOccupiedDatePickers';
import {
  bookingTotalForSpace,
  digitalBookingTotalFromSeconds,
  formatSpaceRateLabel,
  isDigitalScreenPerSecond,
} from '../utils/adSpacePricing';
import {
  bookingDatesAreValid,
  validateBookingDateRange,
} from '../utils/bookingDates';
import {
  validateCardNumber,
  validateExpiry,
  validateCvv,
  validateCardHolderName,
  getExpiryMonthsForYear,
  formatCardNumber,
  validateUpiId,
} from '../utils/paymentValidation';
import QrCode from '@mui/icons-material/QrCode';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';

// PAYMENT CONFIGURATION (Edit these for production)
const TARGET_UPI_ID = "navisooraj.0@oksbi"; // <--- CHANGE THIS TO YOUR ACTUAL UPI ID
const TARGET_PAYEE_NAME = "ArcAds Advertising";

function getCurrentYear() {
  return new Date().getFullYear();
}

function getYearOptions() {
  const current = getCurrentYear();
  return Array.from({ length: 15 }, (_, i) => current + i);
}


export default function BookingDialog({ open, onClose, adSpace, onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [creativeUrl, setCreativeUrl] = useState('');
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [occupiedRanges, setOccupiedRanges] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(''); // '' (none), 'card', or 'upi'
  
  // New States for Mode Selection
  const [bookingMode, setBookingMode] = useState('duration'); // 'duration', 'schedule', 'budget'
  const [durationInput, setDurationInput] = useState('');
  const [utr, setUtr] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [calculatedDuration, setCalculatedDuration] = useState(0);

  useEffect(() => {
    if (!open || !adSpace?.id) return;
    api
      .get(`bookings/space/${adSpace.id}/occupied`)
      .then((res) => {
        if (res.data.success) setOccupiedRanges(res.data.data || []);
      })
      .catch(() => setOccupiedRanges([]));
  }, [open, adSpace?.id]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      setMediaFile(null);
      setCreativeUrl('');
      setCardNumber('');
      setExpiryMonth('');
      setExpiryYear('');
      setCvv('');
      setCardHolderName('');
      setPaymentMethod('');
      setError('');
      setFieldErrors({});
      setOccupiedRanges([]);
      // Reset mode
      setBookingMode('duration');
      setDurationInput('');
      setUtr('');
      setBudgetInput('');
    }
  }, [open]);

  // Daily Rate Logic
  const pricePerDay = Number(adSpace?.pricePerDay || 0);

  // Next Available Date Finder
  useEffect(() => {
    if (!open || !adSpace || (!occupiedRanges.length && startDate)) return;
    
    const findNext = () => {
      let cur = dayjs().startOf('day');
      const from = adSpace.availableFrom ? dayjs(adSpace.availableFrom) : null;
      const to = adSpace.availableTo ? dayjs(adSpace.availableTo) : null;
      
      if (from && cur.isBefore(from)) cur = from;
      
      const occupiedSet = new Set();
      (occupiedRanges || []).forEach(r => {
        let s = dayjs(r.startDate);
        const e = dayjs(r.endDate);
        while(s.isBefore(e) || s.isSame(e)) {
          occupiedSet.add(s.format('YYYY-MM-DD'));
          s = s.add(1, 'day');
        }
      });

      const limit = to || cur.add(1, 'year');
      while(cur.isBefore(limit) || cur.isSame(limit)) {
        const dStr = cur.format('YYYY-MM-DD');
        if (!occupiedSet.has(dStr)) return dStr;
        cur = cur.add(1, 'day');
      }
      return null;
    };

    // const next = findNext();
    // if (next && !startDate) {
    //   setStartDate(next);
    // }
  }, [open, occupiedRanges, adSpace.availableFrom, adSpace.availableTo]);

  // Helper to sync all modes from a single "days" source
  const syncAllFromDays = (days, sourceField) => {
    if (!pricePerDay) return;
    const d = parseInt(days, 10);
    
    // 1. Update calculated duration
    const validDays = !isNaN(d) && d > 0 ? d : 0;
    setCalculatedDuration(validDays);
    setCalculatedTotal(validDays * pricePerDay);

    // 2. Sync other fields based on the source
    if (sourceField !== 'duration') {
      setDurationInput(validDays > 0 ? String(validDays) : '');
    }
    if (sourceField !== 'budget') {
      setBudgetInput(validDays > 0 ? String(validDays * pricePerDay) : '');
    }
    if (sourceField !== 'endDate') {
      if (startDate && validDays > 0) {
        const end = dayjs(startDate).add(validDays - 1, 'day').format('YYYY-MM-DD');
        setEndDate(end);
      } else if (!startDate) {
        setEndDate('');
      }
    }
  };

  // Effect to handle startDate changes (re-calc endDate/budget based on duration)
  useEffect(() => {
    if (startDate && calculatedDuration > 0) {
      const end = dayjs(startDate).add(calculatedDuration - 1, 'day').format('YYYY-MM-DD');
      setEndDate(end);
    }
  }, [startDate]);

  // Handle manual input changes
  const handleDurationChange = (val) => {
    setDurationInput(val);
    const d = parseInt(val, 10);
    syncAllFromDays(d, 'duration');
  };

  const handleBudgetChange = (val) => {
    setBudgetInput(val);
    const b = parseFloat(val);
    if (!isNaN(b) && pricePerDay > 0) {
      const d = Math.floor(b / pricePerDay);
      syncAllFromDays(d, 'budget');
    } else {
      syncAllFromDays(0, 'budget');
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (startDate && val) {
      const s = dayjs(startDate);
      const e = dayjs(val);
      if (s.isValid() && e.isValid()) {
        const d = e.diff(s, 'day') + 1;
        syncAllFromDays(d, 'endDate');
      }
    }
  };

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(mediaFile);
    setMediaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  useEffect(() => {
    if (step !== 1) return;
    if (!expiryMonth || !expiryYear) {
      setFieldErrors((prev) => {
        if (!prev.expiry) return prev;
        return { ...prev, expiry: null };
      });
      return;
    }
    const err = validateExpiry(expiryMonth, expiryYear);
    setFieldErrors((prev) => ({ ...prev, expiry: err }));
  }, [step, expiryMonth, expiryYear]);

  if (!adSpace) return null;

  const isDigital = adSpace && isDigitalScreenPerSecond(adSpace);
  const total = calculatedTotal;
  const dateFeedback =
    startDate || endDate ? validateBookingDateRange(startDate, endDate, occupiedRanges, adSpace.availableFrom, adSpace.availableTo) : null;

  const canGoToPayment =
    Boolean(
      title?.trim() && 
      startDate && 
      endDate && 
      calculatedDuration > 0 && 
      !dateFeedback &&
      bookingDatesAreValid(startDate, endDate, occupiedRanges, adSpace.availableFrom, adSpace.availableTo) &&
      (mediaFile || creativeUrl) &&
      // Extra mode-specific validation
      (bookingMode === 'budget' ? (parseFloat(budgetInput) >= pricePerDay) : true) &&
      (bookingMode === 'duration' ? (parseInt(durationInput, 10) > 0) : true)
    );

  const handleCardNumberChange = (e) => {
    const { formatted } = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (fieldErrors.cardNumber) setFieldErrors((prev) => ({ ...prev, cardNumber: null }));
  };

  const handleCvvChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(v);
    if (fieldErrors.cvv) setFieldErrors((prev) => ({ ...prev, cvv: null }));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setError('');
    const dateErr = validateBookingDateRange(startDate, endDate, occupiedRanges, adSpace.availableFrom, adSpace.availableTo);
    if (dateErr) {
      setError(dateErr);
      return;
    }

    const errors = {};
    if (paymentMethod === 'card') {
      const cnErr = validateCardNumber(cardNumber);
      if (cnErr) errors.cardNumber = cnErr;
      const expErr = validateExpiry(expiryMonth, expiryYear);
      if (expErr) errors.expiry = expErr;
      const cvvErr = validateCvv(cvv);
      if (cvvErr) errors.cvv = cvvErr;
      const nameErr = validateCardHolderName(cardHolderName);
      if (nameErr) errors.cardHolderName = nameErr;
    } else {
      const trimmedUtr = utr.trim();
      if (!trimmedUtr) {
        errors.utr = 'Transaction ID (UTR) is required.';
      } else if (!/^[A-Za-z0-9]+$/.test(trimmedUtr)) {
        errors.utr = 'Only letters and numbers are allowed (no spaces or symbols).';
      } else if (trimmedUtr.length < 10 || trimmedUtr.length > 25) {
        errors.utr = 'Must contain at least 10 numbers or alphabets (max 25).';
      } else if (/^(.)\1+$/.test(trimmedUtr)) {
        errors.utr = 'Please enter a valid Transaction ID.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (!user?.id || !adSpace?.id) return;
    if (!creativeUrl) {
      setError('Please upload your ad creative on the previous step.');
      return;
    }
    setLoading(true);

    const cardDigits = cardNumber.replace(/\s/g, '');
    const body = {
      advertiserId: user.id,
      adSpaceId: adSpace.id,
      title: title.trim(),
      description: description.trim() || null,
      startDate,
      endDate,
      notes,
      creativeUrl,
      paymentMethod,
      transactionId: utr.trim(),
      payment: {
        method: paymentMethod,
        ...(paymentMethod === 'card' ? {
          cardNumber: cardDigits,
          expiryMonth: parseInt(expiryMonth, 10),
          expiryYear: parseInt(expiryYear, 10),
          cvv: cvv.trim(),
          cardHolderName: cardHolderName.trim(),
        } : {
          // No VPA needed
        }),
        amount: total,
      },
    };
    // totalSeconds is no longer used for pricing but we can keep it as null or a fixed value if needed by schema
    body.totalSeconds = null;
    api.post('bookings', body)
      .then((res) => {
        if (res.data.success) {
          setStep(2); // Success step
          setTimeout(() => {
            onSuccess?.(res.data.data);
            onClose();
          }, 4000);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Booking failed'))
      .finally(() => setLoading(false));
  };

  if (!adSpace) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book: {adSpace.title}</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ pt: 0, pb: 2 }}>
          <Step><StepLabel>Details</StepLabel></Step>
          <Step><StepLabel>Payment</StepLabel></Step>
          <Step><StepLabel>Confirm</StepLabel></Step>
        </Stepper>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatSpaceRateLabel(adSpace)}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 0 && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const dateErr = validateBookingDateRange(startDate, endDate, occupiedRanges);
              if (dateErr) {
                setError(dateErr);
                return;
              }
              if (!canGoToPayment) {
                if (!title?.trim()) setError('Title is required.');
                else if (!mediaFile && !creativeUrl) setError('Ad media (photo or video) is required.');
                return;
              }

              if (mediaFile) {
                setUploadingCreative(true);
                try {
                  const fd = new FormData();
                  fd.append('media', mediaFile);
                  const res = await api.post('bookings/upload-creative', fd);
                  if (!res.data?.success || !res.data?.data?.url) {
                    throw new Error(res.data?.message || 'Media upload failed');
                  }
                  setCreativeUrl(res.data.data.url);
                  setStep(1);
                } catch (err) {
                  setError(err.response?.data?.message || err.message || 'Could not upload media');
                } finally {
                  setUploadingCreative(false);
                }
              } else if (creativeUrl) {
                setStep(1);
              }
            }}
          >
            <TextField
              fullWidth
              label="Booking Title"
              placeholder="e.g. Summer Campaign 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
              error={startDate !== '' && !title?.trim()}
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              margin="normal"
            />

            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                Upload Media *
              </Typography>
              <Button variant="outlined" component="label" fullWidth sx={{ mt: 1, textTransform: 'none' }}>
                {mediaFile ? 'Replace media' : 'Choose photo or video'}
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setMediaFile(f);
                    if (f) setCreativeUrl('');
                  }}
                />
              </Button>
              {(mediaPreviewUrl || creativeUrl) && (
                <Box sx={{ mt: 1.5, position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                  {checkIfVideo(mediaPreviewUrl || creativeUrl) ? (
                    <Box
                      component="video"
                      src={mediaPreviewUrl || creativeUrl}
                      controls
                      playsInline
                      sx={{ width: '100%', display: 'block', maxHeight: 200, bgcolor: 'black' }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={mediaPreviewUrl || creativeUrl}
                      alt="Creative Preview"
                      sx={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'contain' }}
                    />
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 1 }}>
                ₹{pricePerDay.toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">/ day</Typography>
              </Typography>

              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 4,
                  background: (t) => t.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : `linear-gradient(160deg, ${t.palette.background.paper} 0%, ${t.palette.grey[50]} 100%)`,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: (t) => t.palette.mode === 'dark' 
                    ? '0 8px 32px rgba(0,0,0,0.2)' 
                    : '0 8px 32px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                  Mode Selection
                </Typography>

                <Tabs
                  value={bookingMode}
                  onChange={(_, val) => setBookingMode(val)}
                  variant="fullWidth"
                  sx={{
                    mb: 3,
                    mt: 1.5,
                    minHeight: 44,
                    '& .MuiTabs-indicator': { 
                      height: 3, 
                      borderRadius: '3px 3px 0 0',
                      bgcolor: 'primary.main',
                      boxShadow: (t) => `0 0 10px ${t.palette.primary.main}60`
                    },
                    '& .MuiTab-root': {
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&.Mui-selected': { 
                        color: 'primary.main',
                      },
                      '&:hover': {
                        color: 'primary.main',
                        opacity: 0.8
                      },
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  <Tab label="Duration" value="duration" />
                  <Tab label="Schedule" value="schedule" />
                  <Tab label="Budget" value="budget" />
                </Tabs>

                <Box sx={{ minHeight: 180 }}>
                  {bookingMode === 'duration' && (
                    <Stack spacing={2.5}>
                      <BookingOccupiedDatePickers
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        occupiedRanges={occupiedRanges}
                        onlyStart
                        minDate={adSpace.availableFrom}
                        maxDate={adSpace.availableTo}
                      />
                      <TextField
                        fullWidth
                        label="Duration (Days)"
                        type="number"
                        value={durationInput}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        inputProps={{ min: 1 }}
                        error={durationInput !== '' && (parseInt(durationInput, 10) <= 0 || isNaN(parseInt(durationInput, 10)))}
                        helperText={durationInput !== '' && (parseInt(durationInput, 10) <= 0 || isNaN(parseInt(durationInput, 10))) ? 'Minimum duration is 1 day' : ''}
                      />
                    </Stack>
                  )}

                  {bookingMode === 'schedule' && (
                    <Stack spacing={2.5}>
                      <BookingOccupiedDatePickers
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={handleEndDateChange}
                        occupiedRanges={occupiedRanges}
                        dateFeedback={dateFeedback}
                        minDate={adSpace.availableFrom}
                        maxDate={adSpace.availableTo}
                      />
                    </Stack>
                  )}

                  {bookingMode === 'budget' && (
                    <Stack spacing={2.5}>
                      <BookingOccupiedDatePickers
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        occupiedRanges={occupiedRanges}
                        onlyStart
                        minDate={adSpace.availableFrom}
                        maxDate={adSpace.availableTo}
                      />
                      <TextField
                        fullWidth
                        label="Total Budget"
                        type="number"
                        value={budgetInput}
                        onChange={(e) => handleBudgetChange(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        error={budgetInput !== '' && (parseFloat(budgetInput) < pricePerDay || isNaN(parseFloat(budgetInput)))}
                        helperText={budgetInput !== '' && (parseFloat(budgetInput) < pricePerDay || isNaN(parseFloat(budgetInput))) ? `Minimum budget is ₹${pricePerDay.toLocaleString()}` : ''}
                      />
                    </Stack>
                  )}

                  {calculatedDuration > 0 && (
                    <Box 
                      sx={{ 
                        mt: 3.5, 
                        p: 2.5, 
                        borderRadius: 3, 
                        background: (t) => t.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`
                          : `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.light} 100%)`,
                        color: 'white',
                        boxShadow: (t) => `0 10px 30px ${t.palette.primary.main}40`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -50,
                          right: -50,
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Booking Summary
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
                            {calculatedDuration} Days
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                            Until {dayjs(endDate).format('MMM D, YYYY')}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, display: 'block' }}>
                            TOTAL AMOUNT
                          </Typography>
                          <Typography variant="h4" fontWeight={900}>
                            ₹{total.toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  
                  {dateFeedback && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {dateFeedback}
                    </Alert>
                  )}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!canGoToPayment || uploadingCreative}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {uploadingCreative ? 'Uploading Creative…' : 'Continue to payment'}
                </Button>
              </Box>
            </Box>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handlePaymentSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                Payment Method
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select how you'd like to pay ₹{total.toLocaleString()}
              </Typography>
            </Box>

            {!paymentMethod ? (
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Box
                  onClick={() => setPaymentMethod('card')}
                  sx={{
                    flex: 1,
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (t) => t.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      background: (t) => t.palette.mode === 'dark' 
                        ? 'rgba(25, 118, 210, 0.15)' 
                        : 'rgba(25, 118, 210, 0.05)',
                      transform: 'translateY(-6px)',
                      boxShadow: (t) => `0 12px 24px ${t.palette.primary.main}20`,
                      '& .payment-icon': { transform: 'scale(1.1)', color: 'primary.main' }
                    }
                  }}
                >
                  <CreditCard className="payment-icon" sx={{ fontSize: 40, color: 'text.secondary', mb: 1.5, transition: 'all 0.3s' }} />
                  <Typography fontWeight={800} color="text.primary">Pay via Card</Typography>
                  <Typography variant="caption" color="text.secondary">Visa, Mastercard, RuPay</Typography>
                </Box>

                <Box
                  onClick={() => setPaymentMethod('upi')}
                  sx={{
                    flex: 1,
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (t) => t.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      background: (t) => t.palette.mode === 'dark' 
                        ? 'rgba(25, 118, 210, 0.15)' 
                        : 'rgba(25, 118, 210, 0.05)',
                      transform: 'translateY(-6px)',
                      boxShadow: (t) => `0 12px 24px ${t.palette.primary.main}20`,
                      '& .payment-icon': { transform: 'scale(1.1)', color: 'primary.main' }
                    }
                  }}
                >
                  <AccountBalanceWallet className="payment-icon" sx={{ fontSize: 40, color: 'text.secondary', mb: 1.5, transition: 'all 0.3s' }} />
                  <Typography fontWeight={800} color="text.primary">Pay via UPI</Typography>
                  <Typography variant="caption" color="text.secondary">GPay, PhonePe, Paytm</Typography>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ mb: 4 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 3,
                    background: (t) => t.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid', 
                    borderColor: 'divider',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        bgcolor: 'primary.main', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: (t) => `0 4px 12px ${t.palette.primary.main}40`
                      }}
                    >
                      {paymentMethod === 'card' ? <CreditCard fontSize="small" /> : <AccountBalanceWallet fontSize="small" />}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        SELECTED METHOD
                      </Typography>
                      <Typography fontWeight={800}>
                        {paymentMethod === 'card' ? 'Credit / Debit Card' : 'UPI Transfer'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button 
                    variant="text"
                    size="small" 
                    onClick={() => { setPaymentMethod(''); setFieldErrors({}); }} 
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 700,
                      borderRadius: 1.5,
                      color: 'primary.main',
                      '&:hover': { bgcolor: (t) => `${t.palette.primary.main}10` }
                    }}
                  >
                    Change
                  </Button>
                </Box>

                {paymentMethod === 'card' ? (
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Card number"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000"
                      inputProps={{ maxLength: 14 }}
                      error={!!fieldErrors.cardNumber}
                      helperText={fieldErrors.cardNumber}
                      required
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl sx={{ minWidth: 100 }} error={!!fieldErrors.expiry}>
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={expiryMonth}
                          label="Month"
                          onChange={(e) => { setExpiryMonth(e.target.value); setFieldErrors((p) => ({ ...p, expiry: null })); }}
                          required
                        >
                          {getExpiryMonthsForYear(expiryYear).map((m) => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 100 }} error={!!fieldErrors.expiry}>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={expiryYear}
                          label="Year"
                          onChange={(e) => {
                            const y = e.target.value;
                            setExpiryYear(y);
                            setFieldErrors((p) => ({ ...p, expiry: null }));
                            const allowed = getExpiryMonthsForYear(y);
                            if (expiryMonth && !allowed.includes(expiryMonth)) {
                              setExpiryMonth('');
                            }
                          }}
                          required
                        >
                          {getYearOptions().map((y) => (
                            <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="CVV"
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        inputProps={{ maxLength: 4 }}
                        error={!!fieldErrors.cvv}
                        helperText={fieldErrors.cvv}
                        sx={{ width: 100 }}
                        required
                      />
                    </Box>
                    {fieldErrors.expiry && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>{fieldErrors.expiry}</Typography>
                    )}
                    <TextField
                      fullWidth
                      label="Card holder name"
                      value={cardHolderName}
                      onChange={(e) => { setCardHolderName(e.target.value); setFieldErrors((p) => ({ ...p, cardHolderName: null })); }}
                      error={!!fieldErrors.cardHolderName}
                      helperText={fieldErrors.cardHolderName}
                      required
                    />
                  </Stack>
                ) : (
                  <Stack spacing={3} alignItems="center" sx={{ py: 1 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        width: 'fit-content',
                        textAlign: 'center',
                        mb: 1
                      }}
                    >
                      {/* Real-time Generated UPI QR Code */}
                      <Box
                        component="img"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          `upi://pay?pa=${TARGET_UPI_ID}&pn=${encodeURIComponent(TARGET_PAYEE_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent(`ArcAds Booking - ${adSpace.title}`)}`
                        )}`}
                        alt="Payment QR Code"
                        sx={{ width: 160, height: 160, display: 'block' }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1.5, fontWeight: 700 }}>
                        Scan with any UPI App
                      </Typography>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Transaction ID (UTR)"
                      placeholder="Enter 12-digit UTR number"
                      value={utr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUtr(val);
                        // Real-time validation for specific rules
                        const newErrors = { ...fieldErrors };
                        if (val && !/^[A-Za-z0-9]*$/.test(val)) {
                          newErrors.utr = 'Only letters and numbers are allowed.';
                        } else if (val && val.length >= 4 && /^(.)\1+$/.test(val)) {
                          newErrors.utr = 'Please enter a valid Transaction ID.';
                        } else {
                          delete newErrors.utr;
                        }
                        setFieldErrors(newErrors);
                      }}
                      inputProps={{ minLength: 10, maxLength: 25 }}
                      error={!!fieldErrors.utr}
                      helperText={fieldErrors.utr || 'Found in your UPI app payment summary'}
                      sx={{ maxWidth: 320, mt: 1 }}
                      required
                    />
                  </Stack>
                )}
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
              <Button type="button" onClick={() => setStep(0)} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
                Back to details
              </Button>
              {paymentMethod && (
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                  sx={{ 
                    px: 4, 
                    py: 1.5, 
                    borderRadius: 2.5, 
                    fontWeight: 800, 
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: t => `0 10px 25px ${t.palette.primary.main}50`
                  }}
                >
                  {loading ? 'Processing…' : 'Confirm Payment & Book'}
                </Button>
              )}
            </Box>
          </form>
        )}

        {step === 2 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: 'success.light', 
              color: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <CheckCircleOutline sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Booking Request Successful!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Request for confirmation sent to vendor successfully. You will get a reply within 24 hours or before your selected Start Date.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Closing this window in 4 seconds...
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
