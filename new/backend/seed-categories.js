/**
 * seed-categories.js
 * Run: node backend/seed-categories.js
 *
 * Upserts the default category GST + shipping values into MongoDB.
 * Safe to run multiple times — existing records are updated, not duplicated.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Category = require('./models/Category');

const DEFAULTS = [
  { name: 'Fan',           gst: 18, shipping: 80  },
  { name: 'Lights',        gst: 12, shipping: 50  },
  { name: 'Motors',        gst: 18, shipping: 100 },
  { name: 'Pipes',         gst: 18, shipping: 50  },
  { name: 'Switches',      gst: 18, shipping: 40  },
  { name: 'Tank',          gst: 18, shipping: 150 },
  { name: 'Water Heater',  gst: 18, shipping: 100 },
  { name: 'Wire & Cables', gst: 18, shipping: 60  },
  { name: 'Heater',        gst: 18, shipping: 100 },
  { name: 'Other',         gst: 18, shipping: 60  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  for (const cat of DEFAULTS) {
    const result = await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: cat },        // only insert if it doesn't exist
      { upsert: true, new: true }
    );
    console.log(`  ✔ ${cat.name} — GST: ${cat.gst}%, Shipping: ₹${cat.shipping}`);
  }

  console.log('\n✅ Categories seeded successfully');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeder error:', err.message);
  process.exit(1);
});
