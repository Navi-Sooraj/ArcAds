import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';

async function fixData() {
  const { AdSpace, Booking, Payment } = models;

  console.log('--- Data Correction Script ---');

  try {
    // 1. Clear pricePerSecond for all AdSpaces
    console.log('Clearing pricePerSecond for all ad spaces...');
    const [updatedSpaces] = await AdSpace.update(
      { pricePerSecond: null },
      { where: { pricePerSecond: { [Op.ne]: null } } }
    );
    console.log(`Cleared pricePerSecond for ${updatedSpaces} ad spaces.`);

    // 2. Identify bookings for Ad Space 8
    const space8 = await AdSpace.findByPk(8);
    if (!space8) {
      console.error('Ad Space 8 not found. Skipping booking recalculation.');
    } else {
      const dailyRate = Number(space8.pricePerDay || 0);
      console.log(`Ad Space 8 found. Daily Rate: ₹${dailyRate}`);

      const bookings = await Booking.findAll({
        where: { adSpaceId: 8 },
        include: [{ model: Payment, as: 'Payments' }]
      });

      console.log(`Found ${bookings.length} bookings for Ad Space 8.`);

      if (dailyRate > 0) {
        for (const b of bookings) {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          const newTotal = Math.round(dailyRate * days * 100) / 100;

          if (Number(b.totalAmount) !== newTotal) {
            console.log(`Updating booking ${b.id}: ₹${b.totalAmount} -> ₹${newTotal} (${days} days)`);
            
            b.totalAmount = newTotal;
            b.totalSeconds = null; // Clear seconds too
            await b.save();

            // Update associated payments
            if (b.Payments && b.Payments.length > 0) {
              for (const p of b.Payments) {
                console.log(`  Updating payment ${p.id}: ₹${p.amount} -> ₹${newTotal}`);
                p.amount = newTotal;
                await p.save();
              }
            }
          } else {
            console.log(`Booking ${b.id} already has correct amount: ₹${newTotal}`);
          }
        }
      } else {
        console.warn('Ad Space 8 has pricePerDay = 0. Skipping recalculation to avoid overwriting with zero.');
      }
    }
    console.log('Data correction complete.');
  } catch (err) {
    console.error('Error during data correction:', err);
  } finally {
    process.exit(0);
  }
}

fixData();
