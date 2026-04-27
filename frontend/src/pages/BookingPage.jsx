import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import CreditCard from '@mui/icons-material/CreditCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingOccupiedDatePickers from '../components/BookingOccupiedDatePickers';
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
} from '../utils/paymentValidation';

function getYearOptions() {
  const y = new Date().getFullYear();
  return Array.from({ length: 15 }, (_, i) => y + i);
}

export default function BookingPage() {
  const { adSpaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [totalSeconds, setTotalSeconds] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [creativeVideoUrl, setCreativeVideoUrl] = useState('');
  const [uploadingCreative, setUploadingCreative] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [occupiedRanges, setOccupiedRanges] = useState([]);

  useEffect(() => {
    if (!adSpaceId) return;
    api
      .get(`bookings/space/${adSpaceId}/occupied`)
      .then((res) => {
        if (res.data.success) setOccupiedRanges(res.data.data || []);
      })
      .catch(() => setOccupiedRanges([]));
  }, [adSpaceId]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.get(`adspaces/${adSpaceId}`).then((res) => {
      if (res.data.success) setSpace(res.data.data);
    });
  }, [adSpaceId, user, navigate]);

  useEffect(() => {
    if (!space?.id) return;
    setStep(0);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setTotalSeconds('');
    setVideoFile(null);
    setCreativeVideoUrl('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setCardHolderName('');
    setError('');
    setFieldErrors({});
  }, [space?.id]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

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

  const isDigital = space && isDigitalScreenPerSecond(space);
  const days =
    startDate && endDate && bookingDatesAreValid(startDate, endDate, occupiedRanges)
      ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
      : 0;
  const dateFeedback =
    startDate || endDate ? validateBookingDateRange(startDate, endDate, occupiedRanges) : null;
  const totalSecondsInt = parseInt(String(totalSeconds), 10) || 0;
  const total = bookingTotalForSpace(space, startDate, endDate);

  const canContinueDetails =
    Boolean(startDate && endDate && days > 0 && bookingDatesAreValid(startDate, endDate, occupiedRanges)) &&
    (!isDigital || (videoFile || creativeVideoUrl));

  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setError('');
    const dateErr = validateBookingDateRange(startDate, endDate, occupiedRanges);
    if (dateErr) {
      setError(dateErr);
      return;
    }
    if (!canContinueDetails) return;

    if (isDigital) {
      if (videoFile) {
        setUploadingCreative(true);
        try {
          const fd = new FormData();
          fd.append('video', videoFile);
          const res = await api.post('bookings/upload-creative', fd);
          if (!res.data?.success || !res.data?.data?.url) {
            throw new Error(res.data?.message || 'Video upload failed');
          }
          setCreativeVideoUrl(res.data.data.url);
          setStep(1);
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Could not upload video');
        } finally {
          setUploadingCreative(false);
        }
      } else if (creativeVideoUrl) {
        setStep(1);
      } else {
        setError('Please select a video file.');
      }
    } else {
      setStep(1);
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    const cnErr = validateCardNumber(cardNumber);
    if (cnErr) errors.cardNumber = cnErr;
    const expErr = validateExpiry(expiryMonth, expiryYear);
    if (expErr) errors.expiry = expErr;
    const cvvErr = validateCvv(cvv);
    if (cvvErr) errors.cvv = cvvErr;
    const nameErr = validateCardHolderName(cardHolderName);
    if (nameErr) errors.cardHolderName = nameErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const dateErr = validateBookingDateRange(startDate, endDate, occupiedRanges);
    if (dateErr) {
      setError(dateErr);
      return;
    }

    if (!user?.id || !space) return;
    if (isDigital && !creativeVideoUrl) {
      setError('Please upload your ad video on the previous step.');
      return;
    }
    setLoading(true);

    const cardDigits = cardNumber.replace(/\s/g, '');
    const body = {
      advertiserId: user.id,
      adSpaceId: Number(adSpaceId),
      startDate,
      endDate,
      notes: notes || undefined,
      payment: {
        cardNumber: cardDigits,
        expiryMonth: parseInt(expiryMonth, 10),
        expiryYear: parseInt(expiryYear, 10),
        cvv: cvv.trim(),
        cardHolderName: cardHolderName.trim(),
        amount: total,
      },
    };
    if (isDigital) {
      body.totalSeconds = totalSecondsInt;
      body.creativeVideoUrl = creativeVideoUrl;
    }

    api
      .post('bookings', body)
      .then((res) => {
        if (res.data.success) setSuccess(true);
      })
      .catch((err) => setError(err.response?.data?.message || 'Booking failed'))
      .finally(() => setLoading(false));
  };

  if (!user) return null;
  if (!space) return <Typography sx={{ p: 2 }}>Loading…</Typography>;

  if (success) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', py: 2 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Booking request submitted. The space owner will accept or reject it.
        </Alert>
        <Button component={Link} to="/advertiser/bookings" variant="contained">
          View My Bookings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', py: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Book: {space.title}
      </Typography>

      <Stepper activeStep={step} sx={{ pt: 0, pb: 2 }}>
        <Step>
          <StepLabel>Details</StepLabel>
        </Step>
        <Step>
          <StepLabel>Payment</StepLabel>
        </Step>
      </Stepper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatSpaceRateLabel(space)}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {step === 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <form onSubmit={handleContinueToPayment}>
            <BookingOccupiedDatePickers
              startDate={startDate}
              endDate={endDate}
              occupiedRanges={occupiedRanges}
              dateFeedback={dateFeedback}
              onStartDateChange={(v) => {
                setStartDate(v);
                if (endDate && endDate < v) setEndDate('');
              }}
              onEndDateChange={setEndDate}
            />

            {isDigital && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Upload your ad creative (video)
                </Typography>
                <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
                  Choose video file
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setVideoFile(f);
                      if (f) setCreativeVideoUrl('');
                    }}
                  />
                </Button>
                {(videoPreviewUrl || creativeVideoUrl) && (
                  <Box
                    component="video"
                    src={videoPreviewUrl || creativeVideoUrl}
                    controls
                    playsInline
                    sx={{ mt: 2, width: '100%', maxHeight: 240, borderRadius: 1, bgcolor: 'black' }}
                  />
                )}
                {videoFile && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {videoFile.name}
                  </Typography>
                )}
                {!videoFile && creativeVideoUrl && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Video uploaded — choose a new file to replace it
                  </Typography>
                )}
              </>
            )}

            {days > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Estimated total
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  ₹{total.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {days} day(s) × {Number(space.pricePerDay).toLocaleString()} ₹/day
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              margin="normal"
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Button component={Link} to="/marketplace" color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canContinueDetails || uploadingCreative}>
                {uploadingCreative ? 'Uploading video…' : 'Continue to payment'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {step === 1 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <form onSubmit={handlePaymentSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pay ₹{total.toLocaleString()}
              {days > 0 && ` for ${days} day(s)`}
            </Typography>
            <TextField
              fullWidth
              label="Card number"
              value={cardNumber}
              onChange={(e) => {
                const { formatted } = formatCardNumber(e.target.value);
                setCardNumber(formatted);
                if (fieldErrors.cardNumber) setFieldErrors((p) => ({ ...p, cardNumber: null }));
              }}
              placeholder="0000 0000 0000"
              inputProps={{ maxLength: 14 }}
              error={!!fieldErrors.cardNumber}
              helperText={fieldErrors.cardNumber}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 100 }} error={!!fieldErrors.expiry}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={expiryMonth}
                  label="Month"
                  onChange={(e) => {
                    setExpiryMonth(e.target.value);
                    setFieldErrors((p) => ({ ...p, expiry: null }));
                  }}
                  required
                >
                  {getExpiryMonthsForYear(expiryYear).map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
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
                    <MenuItem key={y} value={String(y)}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="CVV"
                value={cvv}
                onChange={(e) => {
                  setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (fieldErrors.cvv) setFieldErrors((p) => ({ ...p, cvv: null }));
                }}
                placeholder="123"
                inputProps={{ maxLength: 4 }}
                error={!!fieldErrors.cvv}
                helperText={fieldErrors.cvv}
                sx={{ width: 100 }}
                required
              />
            </Box>
            {fieldErrors.expiry && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                {fieldErrors.expiry}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Card holder name"
              value={cardHolderName}
              onChange={(e) => {
                setCardHolderName(e.target.value);
                if (fieldErrors.cardHolderName) setFieldErrors((p) => ({ ...p, cardHolderName: null }));
              }}
              error={!!fieldErrors.cardHolderName}
              helperText={fieldErrors.cardHolderName}
              margin="normal"
              required
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Button type="button" onClick={() => setStep(0)} startIcon={<CreditCard />} disabled={loading}>
                Back
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Processing…' : `Pay ₹${total.toLocaleString()} & book`}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
}
