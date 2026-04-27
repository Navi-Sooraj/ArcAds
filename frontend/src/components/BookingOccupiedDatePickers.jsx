import { useMemo } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Typography, Badge } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import {
  datesSetFromOccupiedRanges,
  getTodayDateInputMin,
  getEndDateMin,
} from '../utils/bookingDates';

export default function BookingOccupiedDatePickers({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  occupiedRanges,
  dateFeedback,
  onlyStart = false,
  minDate,
  maxDate,
}) {
  const todayMin = getTodayDateInputMin();
  const bookedSet = useMemo(() => datesSetFromOccupiedRanges(occupiedRanges), [occupiedRanges]);
  
  const actualMinStart = minDate ? dayjs(minDate) : dayjs(todayMin);
  const actualMax = maxDate ? dayjs(maxDate) : undefined;
  
  // End date min is always day after start date
  const minEnd = dayjs(getEndDateMin(startDate));

  const disableBooked = (d) => !!bookedSet[d.format('YYYY-MM-DD')];

  const renderDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');
    const status = !outsideCurrentMonth ? bookedSet[dateStr] : null;
    const isBooked = !!status;
    const isPending = status === 'pending';
    
    return (
      <PickersDay 
        {...other} 
        outsideCurrentMonth={outsideCurrentMonth} 
        day={day}
        sx={{
          ...(isBooked && {
            color: '#fff !important',
            fontWeight: 700,
            backgroundColor: `${isPending ? '#faad14' : '#ff4d4f'} !important`,
            opacity: 1,
            '&:hover': {
              backgroundColor: `${isPending ? '#d48806' : '#d9363e'} !important`,
            },
            '&.Mui-disabled': {
              color: '#fff !important',
              opacity: 0.9,
              backgroundColor: `${isPending ? '#faad14' : '#ff4d4f'} !important`,
            }
          })
        }}
      />
    );
  };

  const startVal = startDate && dayjs(startDate).isValid() ? dayjs(startDate) : null;
  const endVal = endDate && dayjs(endDate).isValid() ? dayjs(endDate) : null;

  return (
    <>
      <DatePicker
        label="Start date"
        value={startVal}
        format="DD MMM YYYY"
        onChange={(v) => {
          const s = v && v.isValid() ? v.format('YYYY-MM-DD') : '';
          onStartDateChange(s);
        }}
        minDate={actualMinStart}
        maxDate={actualMax}
        shouldDisableDate={disableBooked}
        slots={{ day: renderDay }}
        slotProps={{
          textField: {
            fullWidth: true,
            margin: 'normal',
            helperText: onlyStart ? 'Choose your start date' : 'Booked dates (marked red) are not selectable',
            required: true,
          },
        }}
      />
      {!onlyStart && (
        <DatePicker
          label="End date"
          value={endVal}
          format="DD MMM YYYY"
          onChange={(v) => onEndDateChange(v && v.isValid() ? v.format('YYYY-MM-DD') : '')}
          minDate={minEnd}
          maxDate={actualMax}
          shouldDisableDate={disableBooked}
          slots={{ day: renderDay }}
          slotProps={{
            textField: {
              fullWidth: true,
              margin: 'normal',
              helperText: 'Must be on or after start; booked dates disabled',
              required: true,
            },
          }}
        />
      )}
      {dateFeedback && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: -0.5, mb: 0.5 }}>
          {dateFeedback}
        </Typography>
      )}
    </>
  );
}
