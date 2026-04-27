import models from '../models/index.js';

async function checkBooking8() {
  const { Booking } = models;
  const booking = await Booking.findOne({ where: { adSpaceId: 8 } });
  console.log(JSON.stringify(booking.toJSON(), null, 2));
  process.exit(0);
}

checkBooking8();
