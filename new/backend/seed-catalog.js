const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Product Catalog Seeder — 32 Real Products
 * Category specs are fully structured (not generic placeholder values).
 * Connects to PRODUCTS_MONGO_URI (if set in .env) or MONGO_URI as fallback.
 * Does NOT touch Admin / User / Order / Cart collections.
 * Run: npm run seed:catalog
 * Reset: npm run seed:catalog -- -d
 */

// ── Schema ──────────────────────────────────────────────────────────────────
const Product = require('./models/Product');

// ── Connection ───────────────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.PRODUCTS_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ No MongoDB URI found. Set MONGO_URI or PRODUCTS_MONGO_URI in .env');
    process.exit(1);
  }
  const conn = await mongoose.connect(uri, {
    retryWrites: true,
    w: 'majority',
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  console.log(`📊 Database: ${conn.connection.name}\n`);
};

// ── Product Catalog ──────────────────────────────────────────────────────────
const catalog = [

  // ───────────────────────────────────────────────
  // TANK (2)
  // ───────────────────────────────────────────────
  {
    name: '1500 Ltr Supreme 4 Layer Water Tank',
    description: 'Supreme 4-layer water storage tank made from food-grade HDPE plastic. UV stabilised, anti-bacterial, strong and leak-proof construction. Ideal for overhead installation.',
    price: 12500,
    category: 'Tank',
    brand: 'Supreme',
    image: '/uploads/products/sample-tank.jpg',
    images: [],
    stock: 12,
    specifications: {
      capacityLiters: 1500,
      material: 'HDPE Plastic',
      numberOfLayers: 4,
      height: '1.6m',
      diameter: '1200mm',
      warranty: '5 Years',
      color: 'White'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Sintex 500L Water Tank',
    description: 'Sintex triple-layer water storage tank with UV protection. Keeps water clean and hygienic. Suitable for domestic and commercial overhead installation.',
    price: 4990,
    category: 'Tank',
    brand: 'Sintex',
    image: '/uploads/products/sample-tank.jpg',
    images: [],
    stock: 20,
    specifications: {
      capacityLiters: 500,
      material: 'HDPE Plastic',
      numberOfLayers: 3,
      height: '1.2m',
      diameter: '900mm',
      warranty: '5 Years',
      color: 'Black'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // WATER HEATER (6)
  // ───────────────────────────────────────────────
  {
    name: '3 Litre Vertical Instant Geyser with Built-in Thermostat',
    description: '3-litre instant water heater with built-in thermostat for quick hot water delivery. Stainless steel inner tank, rust-resistant body, and automatic safety cut-off.',
    price: 3499,
    category: 'Water Heater',
    brand: 'Generic',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 30,
    specifications: {
      capacityLiters: 3,
      powerWatt: 3000,
      voltage: '220V',
      heatingElementType: 'Copper',
      innerTankMaterial: 'Stainless Steel',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Bajaj 25L Storage Water Heater',
    description: 'Bajaj Calenta Plus 25L storage water heater with 4-level safety system. Superior corrosion-resistant glasslined tank. Ideal for large family use.',
    price: 8499,
    category: 'Water Heater',
    brand: 'Bajaj',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 22,
    specifications: {
      capacityLiters: 25,
      powerWatt: 2000,
      voltage: '220V',
      heatingElementType: 'Copper',
      innerTankMaterial: 'Glasslined Steel',
      warranty: '5 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },
  {
    name: 'Crompton 25L Instant Heater',
    description: 'Crompton Arno Neo 25L instant water heater with stainless steel inner tank. Auto cut-off, rust-proof body, and rapid heat technology.',
    price: 7999,
    category: 'Water Heater',
    brand: 'Crompton',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 25,
    specifications: {
      capacityLiters: 25,
      powerWatt: 2000,
      voltage: '220V',
      heatingElementType: 'Copper',
      innerTankMaterial: 'Stainless Steel',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Crompton Solarium Care 6-L 5 Star Storage Water Heater',
    description: 'Crompton Solarium Care 6L storage water heater with 5-star energy rating. Glasslined tank, adjustable thermostat, and pressure release valve for safe operation.',
    price: 5499,
    category: 'Water Heater',
    brand: 'Crompton',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 18,
    specifications: {
      capacityLiters: 6,
      powerWatt: 2000,
      voltage: '220V',
      heatingElementType: 'Copper',
      innerTankMaterial: 'Glasslined Tank',
      warranty: '5 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Crompton Versa Horizontal RHS 25L Storage Water Heater',
    description: 'Crompton Versa 25L horizontal RHS mount water heater. Space-saving design for low-ceiling bathrooms. Glasslined inner tank with anti-siphon system.',
    price: 9299,
    category: 'Water Heater',
    brand: 'Crompton',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 14,
    specifications: {
      capacityLiters: 25,
      powerWatt: 2000,
      voltage: '220V',
      heatingElementType: 'Copper',
      innerTankMaterial: 'Glasslined Steel',
      warranty: '5 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Havells 15L Storage Heater',
    description: 'Havells Monza Slim 15L storage water heater with advanced incoloy heating element. Titanium enamel coated tank for extra protection against corrosion.',
    price: 6990,
    category: 'Water Heater',
    brand: 'Havells',
    image: '/uploads/products/sample-heater.jpg',
    images: [],
    stock: 28,
    specifications: {
      capacityLiters: 15,
      powerWatt: 2000,
      voltage: '220V',
      heatingElementType: 'Incoloy',
      innerTankMaterial: 'Glass Coated Tank',
      warranty: '5 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },

  // ───────────────────────────────────────────────
  // FAN (6)
  // ───────────────────────────────────────────────
  {
    name: 'ACTIVA 390 Rpm 1200Mm Ceiling Fan',
    description: 'Activa high-speed ceiling fan with 1200mm sweep and 390 RPM speed. Energy-efficient motor with elegant design. Suitable for large rooms.',
    price: 1499,
    category: 'Fan',
    brand: 'Activa',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 45,
    specifications: {
      bladeSize: 48,
      sweep: 1200,
      rpm: 390,
      powerConsumption: 75,
      mountType: 'Ceiling',
      numberOfBlades: 3,
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Aeroquiet Premium Silent Ceiling Fan',
    description: 'Ultra-silent BLDC ceiling fan with aerodynamic blades for noiseless operation and superior air delivery. Saves up to 50% electricity vs conventional fans.',
    price: 3999,
    category: 'Fan',
    brand: 'Aeroquiet',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 30,
    specifications: {
      bladeSize: 48,
      sweep: 1200,
      rpm: 350,
      powerConsumption: 50,
      mountType: 'Ceiling',
      motorType: 'BLDC',
      numberOfBlades: 3,
      warranty: '3 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Atomberg Aris Starlight Smart Ceiling Fan',
    description: 'Atomberg Aris BLDC smart ceiling fan with remote control operation, 6-speed settings, and sleep mode. Saves up to 65% energy. Compatible with Alexa & Google Home.',
    price: 5499,
    category: 'Fan',
    brand: 'Atomberg',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 20,
    specifications: {
      bladeSize: 48,
      sweep: 1200,
      rpm: 350,
      powerConsumption: 35,
      mountType: 'Ceiling',
      motorType: 'BLDC',
      remoteControl: 'Yes',
      warranty: '3 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },
  {
    name: 'Crompton SUREBREEZE Sea Sapphira 1200 Mm Ceiling Fan',
    description: 'Crompton SureBreeze Sea Sapphira 1200mm ceiling fan with high air delivery and low power consumption. Rust-resistant motor body and stylish design.',
    price: 1899,
    category: 'Fan',
    brand: 'Crompton',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 38,
    specifications: {
      bladeSize: 48,
      sweep: 1200,
      rpm: 380,
      powerConsumption: 75,
      mountType: 'Ceiling',
      numberOfBlades: 3,
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Havells Ceiling Fan 1200mm',
    description: 'Havells Florence 1200mm ceiling fan with CNC balanced blades and moisture-resistant motor. Delivers high air volume with minimal noise and vibration.',
    price: 2499,
    category: 'Fan',
    brand: 'Havells',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 50,
    specifications: {
      bladeSize: 48,
      sweep: 1200,
      rpm: 370,
      powerConsumption: 75,
      mountType: 'Ceiling',
      numberOfBlades: 3,
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Usha Table Fan 400mm',
    description: 'Usha Mist Air Icy 400mm table fan with 3-speed control and auto-oscillation. Compact and portable with a 4-hour timer for convenience.',
    price: 1799,
    category: 'Fan',
    brand: 'Usha',
    image: '/uploads/products/sample-fan.jpg',
    images: [],
    stock: 35,
    specifications: {
      bladeSize: 16,
      sweep: 400,
      rpm: 1350,
      powerConsumption: 55,
      mountType: 'Table',
      numberOfBlades: 3,
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // MOTORS (5)
  // ───────────────────────────────────────────────
  {
    name: 'Crompton 1HP Single Phase Motor',
    description: 'Crompton high-efficiency 1HP single-phase induction motor. Suitable for domestic water pumps, compressors, and agricultural equipment. Class B insulation.',
    price: 5990,
    category: 'Motors',
    brand: 'Crompton',
    image: '/uploads/products/sample-motor.jpg',
    images: [],
    stock: 18,
    specifications: {
      powerHP: 1,
      voltage: '220V',
      phase: 'Single Phase',
      rpm: 1440,
      insulationClass: 'B',
      mountingType: 'Foot Mounted',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Crompton Greaves 3 HP Motor Three Phase -1440 RPM',
    description: 'Crompton Greaves 3HP three-phase induction motor. IE2 efficiency class. Suitable for industrial machinery, pumps, and compressors. Class F insulation, foot mounted.',
    price: 12990,
    category: 'Motors',
    brand: 'Crompton',
    image: '/uploads/products/sample-motor.jpg',
    images: [],
    stock: 10,
    specifications: {
      powerHP: 3,
      voltage: '415V',
      phase: 'Three Phase',
      rpm: 1440,
      insulationClass: 'F',
      mountingType: 'Foot Mounted',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Havells 0.5HP Submersible Motor',
    description: 'Havells 0.5HP submersible pump motor. Designed for borewell and open-well applications. Water-cooled motor with stainless steel body for corrosion resistance.',
    price: 6990,
    category: 'Motors',
    brand: 'Havells',
    image: '/uploads/products/sample-motor.jpg',
    images: [],
    stock: 25,
    specifications: {
      powerHP: 0.5,
      voltage: '220V',
      phase: 'Single Phase',
      rpm: 2880,
      motorType: 'Submersible',
      insulationClass: 'B',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Havells F4053 Single Phase 0.5 HP 4 Pole Motor',
    description: 'Havells MHPCTOS050X 0.5HP 4-pole single-phase motor. Flange mounted design for compact installations. Class B insulation with low vibration and noise.',
    price: 4999,
    category: 'Motors',
    brand: 'Havells',
    image: '/uploads/products/sample-motor.jpg',
    images: [],
    stock: 15,
    specifications: {
      powerHP: 0.5,
      voltage: '220V',
      phase: 'Single Phase',
      rpm: 1440,
      poles: 4,
      mountingType: 'Flange Mounted',
      insulationClass: 'B',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Impel IE2 Series 1 HP Three Phase AC Induction Motor',
    description: 'Impel IE2 energy-efficient 1HP three-phase AC induction motor. Suitable for pumps, fans, and compressors. Aluminium die-cast body for lightweight durability.',
    price: 7499,
    category: 'Motors',
    brand: 'Impel',
    image: '/uploads/products/sample-motor.jpg',
    images: [],
    stock: 12,
    specifications: {
      powerHP: 1,
      voltage: '415V',
      phase: 'Three Phase',
      rpm: 2880,
      efficiencyClass: 'IE2',
      motorType: 'Induction Motor',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // LIGHTS (3)
  // ───────────────────────────────────────────────
  {
    name: 'Orient Electric 12W High Glow LED Bulb',
    description: 'Orient Eternal Shine 12W LED bulb with high lumen output and cool white light. 90% energy saving. Suitable for homes, offices, and shops.',
    price: 149,
    category: 'Lights',
    brand: 'Orient',
    image: '/uploads/products/sample-bulb.jpg',
    images: [],
    stock: 200,
    specifications: {
      lightType: 'LED Bulb',
      wattage: 12,
      colorTemperature: 'Cool White',
      lumens: 900,
      voltage: '220V',
      baseType: 'B22',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Philips 9W LED Bulb Pack of 4',
    description: 'Philips Steller Bright 9W LED B22 bulb — pack of 4. Cool daylight, 850 lumens. 15,000+ hours lifespan. Energy-saving replacement for 60W incandescent.',
    price: 599,
    category: 'Lights',
    brand: 'Philips',
    image: '/uploads/products/sample-bulb.jpg',
    images: [],
    stock: 150,
    specifications: {
      lightType: 'LED Bulb',
      wattage: 9,
      colorTemperature: 'Cool Daylight',
      lumens: 850,
      voltage: '220V',
      baseType: 'B22',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },
  {
    name: 'Syska 12W LED Tubelight',
    description: 'Syska SSK-T8 12W LED tube light. T8 form factor with instant start. High lumen output of 1200lm. Suitable for homes, offices, and commercial spaces.',
    price: 349,
    category: 'Lights',
    brand: 'Syska',
    image: '/uploads/products/sample-tube.jpg',
    images: [],
    stock: 120,
    specifications: {
      lightType: 'LED Tubelight',
      wattage: 12,
      colorTemperature: 'Cool White',
      lumens: 1200,
      voltage: '220V',
      warranty: '1 Year'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // SWITCHES (4)
  // ───────────────────────────────────────────────
  {
    name: '6 M Combined Plate Magnus Matt Grey',
    description: '6-module combined modular switch plate in premium Matt Grey finish. Compatible with all standard modular switches. Elegant design for modern interiors.',
    price: 699,
    category: 'Switches',
    brand: 'Magnus',
    image: '/uploads/products/sample-switch.jpg',
    images: [],
    stock: 80,
    specifications: {
      switchType: 'Modular Plate',
      currentRating: '6A',
      voltage: '220-240V',
      color: 'Matt Grey',
      plateIncluded: 'Yes',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Anchor Modular Switch 6A - Pack of 10',
    description: 'Anchor Roma 6A modular switches — pack of 10. Robust construction with superior contact mechanism. Easy to install. Compatible with standard modular plates.',
    price: 899,
    category: 'Switches',
    brand: 'Anchor',
    image: '/uploads/products/sample-switch.jpg',
    images: [],
    stock: 150,
    specifications: {
      switchType: 'Modular Switch',
      currentRating: '6A',
      voltage: '220-240V',
      color: 'White',
      plateIncluded: 'No',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'GM Modular Switch Board 8 Module',
    description: 'GM Gleam 8-module switch board with stylish flush design. Accommodates up to 8 standard modular switches. Damp-proof and flame-retardant material.',
    price: 1299,
    category: 'Switches',
    brand: 'GM',
    image: '/uploads/products/sample-switchboard.jpg',
    images: [],
    stock: 60,
    specifications: {
      switchType: 'Switch Board',
      currentRating: '6A/16A',
      voltage: '220-240V',
      color: 'White',
      plateIncluded: 'Yes',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'HAVELLS Coral-Series 3 Pin Socket 6A',
    description: 'Havells Coral 3-pin socket 6A with shutter. ISI marked, child-safe shutter mechanism, heavy brass contacts for reliable performance.',
    price: 299,
    category: 'Switches',
    brand: 'Havells',
    image: '/uploads/products/sample-switch.jpg',
    images: [],
    stock: 200,
    specifications: {
      switchType: '3 Pin Socket',
      currentRating: '6A',
      voltage: '220-240V',
      color: 'White',
      plateIncluded: 'No',
      warranty: '2 Years'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // PIPES (4)
  // ───────────────────────────────────────────────
  {
    name: 'Ashirvad Equal "Y" With Door',
    description: 'Ashirvad UPVC Equal Y junction with cleanout door for drainage systems. Easy access for maintenance and clearing blockages. ISI certified for quality assurance.',
    price: 890,
    category: 'Pipes',
    brand: 'Ashirvad',
    image: '/uploads/products/sample-pipe.jpg',
    images: [],
    stock: 40,
    specifications: {
      diameter: '110mm',
      length: 'Standard',
      material: 'UPVC',
      pressureRating: 'High Pressure',
      usageType: 'Drainage',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Astral CPVC Pipes 15mm - 3m',
    description: 'Astral 15mm CPVC pipe 3m length for hot and cold water supply. PN16 pressure rated. ISI certified and RoHS compliant. Temperature tolerant up to 93°C.',
    price: 399,
    category: 'Pipes',
    brand: 'Astral',
    image: '/uploads/products/sample-pipe.jpg',
    images: [],
    stock: 60,
    specifications: {
      diameter: '15mm',
      length: '3m',
      material: 'CPVC',
      pressureRating: 'Medium Pressure',
      usageType: 'Water Supply',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },
  {
    name: 'Silent Pipes - Ashirvad',
    description: 'Ashirvad Silent UPVC drainage pipe 110mm × 3m. Multi-layer construction for noise reduction of up to 40dB. Ideal for multi-storey residential and commercial buildings.',
    price: 1490,
    category: 'Pipes',
    brand: 'Ashirvad',
    image: '/uploads/products/sample-pipe.jpg',
    images: [],
    stock: 35,
    specifications: {
      diameter: '110mm',
      length: '3m',
      material: 'UPVC',
      pressureRating: 'High Pressure',
      usageType: 'Drainage',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },
  {
    name: 'Supreme PVC Pipes 20mm - 6m',
    description: 'Supreme 20mm PVC pressure pipe 6m length. PN10 rated for water supply and irrigation. Lightweight, UV-resistant, and easy to join with standard solvent cement.',
    price: 599,
    category: 'Pipes',
    brand: 'Supreme',
    image: '/uploads/products/sample-pipe.jpg',
    images: [],
    stock: 50,
    specifications: {
      diameter: '20mm',
      length: '6m',
      material: 'PVC',
      pressureRating: 'Low Pressure',
      usageType: 'Water Supply',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  },

  // ───────────────────────────────────────────────
  // WIRE & CABLES (2)
  // ───────────────────────────────────────────────
  {
    name: 'Havells 4 Core Flexible Cable - 1100m',
    description: 'Havells 4-core flexible PVC insulated cable 6 sq mm — 1100m drum. 1100V rated. ISI certified. Suitable for industrial wiring, control panels, and power distribution.',
    price: 45990,
    category: 'Wire & Cables',
    brand: 'Havells',
    image: '/uploads/products/sample-wire.jpg',
    images: [],
    stock: 5,
    specifications: {
      coreType: '4 Core',
      wireGauge: '6 sq mm',
      length: 1100,
      conductorMaterial: 'Copper',
      insulationType: 'PVC',
      voltageRating: '1100V',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: true
  },
  {
    name: 'Polycab FR Wire 2.5 sq mm - 90m',
    description: 'Polycab Agni FR (Flame Retardant) PVC single-core wire 2.5 sq mm — 90m coil. ISI certified. Ideal for domestic and light commercial electrical wiring.',
    price: 2499,
    category: 'Wire & Cables',
    brand: 'Polycab',
    image: '/uploads/products/sample-wire.jpg',
    images: [],
    stock: 30,
    specifications: {
      coreType: 'Single Core',
      wireGauge: '2.5 sq mm',
      length: 90,
      conductorMaterial: 'Copper',
      insulationType: 'FR PVC',
      voltageRating: '1100V',
      isiCertified: 'Yes'
    },
    ratings: { average: 0, count: 0 },
    status: 'active',
    featured: false
  }
];

// ── Import ────────────────────────────────────────────────────────────────────
const importData = async () => {
  let inserted = 0;
  let updated = 0;

  for (const item of catalog) {
    const exists = await Product.findOne({ name: item.name });
    if (exists) {
      // Update with correct specifications, prices, and descriptions
      await Product.findByIdAndUpdate(exists._id, {
        description: item.description,
        price: item.price,
        category: item.category,
        brand: item.brand,
        stock: item.stock > 0 ? item.stock : exists.stock,
        specifications: item.specifications,
        ratings: item.ratings,
        status: item.status,
        featured: item.featured
      }, { new: true, runValidators: false });
      console.log(`🔄 Updated specs: ${item.name}`);
      updated++;
    } else {
      await Product.create(item);
      console.log(`✅ Inserted: ${item.name}`);
      inserted++;
    }
  }

  console.log(`\n🎉 Done! Inserted: ${inserted}, Updated: ${updated}`);
  console.log(`📦 Total products in catalog: ${catalog.length}`);
};

// ── Destroy catalog products only ─────────────────────────────────────────────
const destroyData = async () => {
  const names = catalog.map(p => p.name);
  const result = await Product.deleteMany({ name: { $in: names } });
  console.log(`🗑️  Removed ${result.deletedCount} catalog products.`);
};

// ── Run ───────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    if (process.argv[2] === '-d') {
      await destroyData();
    } else {
      await importData();
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exit(1);
  }
})();
