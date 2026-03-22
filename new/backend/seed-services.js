const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load Service model
const Service = require('./models/Service');

// Load env vars
dotenv.config();

/**
 * Service Data Seeder
 * Seeds MongoDB with demo electrical services
 * Run: npm run seed:services
 */

// Sample Services Data
const services = [
  {
    name: 'Electrical Installation',
    description: 'Professional electrical installation services for homes and offices. We handle all types of wiring, circuit installation, and electrical system setup.',
    icon: '⚡',
    image: 'https://via.placeholder.com/400x300?text=Electrical+Installation',
    features: [
      'New wiring installation',
      'Circuit breaker installation',
      'Cable management',
      'Load management',
      'Energy efficient solutions',
      'Safety inspection included'
    ],
    price: 500,
    duration: '2-4 hours',
    status: 'active'
  },
  {
    name: 'Wiring & Rewiring',
    description: 'Complete wiring solutions for new constructions or old house rewiring. We use premium quality cables and follow all safety standards.',
    icon: '🔌',
    image: 'https://via.placeholder.com/400x300?text=Wiring+Rewiring',
    features: [
      'Copper wire installation',
      'Wall chasing & channeling',
      'Conduit pipe installation',
      'Old wiring replacement',
      'Underground wiring',
      'Waterproof wiring solutions'
    ],
    price: 400,
    duration: '1-3 days',
    status: 'active'
  },
  {
    name: 'Light Fitting Installation',
    description: 'Expert installation of ceiling lights, wall lights, chandeliers, and decorative lighting. Professional mounting and wiring.',
    icon: '💡',
    image: 'https://via.placeholder.com/400x300?text=Light+Fitting',
    features: [
      'Ceiling light installation',
      'Pendant light setup',
      'Wall sconce installation',
      'Chandelier mounting',
      'Recessed lighting',
      'Dimmer switch installation',
      'LED light integration'
    ],
    price: 250,
    duration: '30 minutes - 1 hour',
    status: 'active'
  },
  {
    name: 'Fan Installation & Repair',
    description: 'Installation and repair services for ceiling fans, exhaust fans, and ventilation systems. Quick service with warranty.',
    icon: '🌀',
    image: 'https://via.placeholder.com/400x300?text=Fan+Installation',
    features: [
      'Ceiling fan installation',
      'Exhaust fan setup',
      'Wall fan mounting',
      'Motor repair & replacement',
      'Speed controller installation',
      'Blade balancing',
      'Annual maintenance plans'
    ],
    price: 200,
    duration: '1-2 hours',
    status: 'active'
  },
  {
    name: 'Socket & Switch Installation',
    description: 'Installation of electrical sockets, switches, and distribution boards. Modern designs with safety features.',
    icon: '🔲',
    image: 'https://via.placeholder.com/400x300?text=Socket+Switch',
    features: [
      '5-amp and 15-amp sockets',
      'GFCI outlet installation',
      'Smart switch setup',
      'USB charging outlets',
      'Switch board installation',
      'Concealed & open wiring',
      'Safety certification'
    ],
    price: 150,
    duration: '30 minutes - 1 hour',
    status: 'active'
  },
  {
    name: 'Electrical Maintenance',
    description: 'Regular maintenance and inspection of electrical systems. Prevent accidents and ensure safety with our professional maintenance service.',
    icon: '🔧',
    image: 'https://via.placeholder.com/400x300?text=Maintenance',
    features: [
      'Safety inspection',
      'Voltage testing',
      'Circuit testing',
      'Earth grounding check',
      'Load balancing',
      'Wire replacement',
      'Annual maintenance contract'
    ],
    price: 300,
    duration: '1-2 hours',
    status: 'active'
  },
  {
    name: 'MCB & Earthing Installation',
    description: 'Installation of Miniature Circuit Breakers and proper earthing systems for complete safety of your electrical system.',
    icon: '⚙️',
    image: 'https://via.placeholder.com/400x300?text=MCB+Earthing',
    features: [
      'MCB installation',
      'Double pole switch installation',
      'Earthing rod setup',
      'Grounding conductor installation',
      'Lightning arrestor setup',
      'Safety certification',
      'Emergency backup systems'
    ],
    price: 350,
    duration: '2-3 hours',
    status: 'active'
  },
  {
    name: 'AC Panel Installation',
    description: 'Professional installation of air conditioner panels and outdoor units with proper electrical connections.',
    icon: '❄️',
    image: 'https://via.placeholder.com/400x300?text=AC+Installation',
    features: [
      'Indoor unit mounting',
      'Outdoor unit installation',
      'Refrigerant line setup',
      'Dedicated circuit installation',
      'Proper wiring & insulation',
      'Power stabilizer setup',
      'Warranty & service plan'
    ],
    price: 600,
    duration: '3-4 hours',
    status: 'active'
  },
  {
    name: 'Water Heater Installation',
    description: 'Installation and connection of electric water heaters for homes and offices. Safe and efficient heating solutions.',
    icon: '🔥',
    image: 'https://via.placeholder.com/400x300?text=Water+Heater',
    features: [
      'Water heater mounting',
      'Electrical connection',
      'Thermostat installation',
      'Safety valve setup',
      'Proper grounding',
      'Leakage protection',
      'Maintenance service available'
    ],
    price: 350,
    duration: '1-2 hours',
    status: 'active'
  },
  {
    name: 'Electrical Troubleshooting',
    description: 'Expert diagnosis and repair of electrical problems. Quick response to electrical faults and emergency situations.',
    icon: '🔍',
    image: 'https://via.placeholder.com/400x300?text=Troubleshooting',
    features: [
      'Fault diagnosis',
      'Short circuit detection',
      'Appliance troubleshooting',
      'Emergency repairs',
      '24/7 service available',
      'Quick response time',
      'Transparent pricing'
    ],
    price: 200,
    duration: '30 minutes - 2 hours',
    status: 'active'
  },
  {
    name: 'Home Theater Wiring',
    description: 'Professional installation of home theater systems with proper wiring and connectivity solutions.',
    icon: '🎬',
    image: 'https://via.placeholder.com/400x300?text=Home+Theater',
    features: [
      'Speaker wiring installation',
      'HDMI cable routing',
      'Power distribution setup',
      'Concealed wiring',
      'Junction box installation',
      'Audio setup optimization',
      'System testing & calibration'
    ],
    price: 450,
    duration: '2-3 hours',
    status: 'active'
  },
  {
    name: 'Solar Panel Installation',
    description: 'Installation of solar panels for homes and offices. Go green with renewable energy solutions.',
    icon: '☀️',
    image: 'https://via.placeholder.com/400x300?text=Solar+Panel',
    features: [
      'Solar panel mounting',
      'Inverter installation',
      'Battery setup',
      'Electrical integration',
      'Roof assessment',
      'Grid connection',
      'Warranty & maintenance'
    ],
    price: 5000,
    duration: '1-2 days',
    status: 'active'
  },
  {
    name: 'Emergency Lighting System',
    description: 'Installation of backup lighting and emergency systems for safety during power outages.',
    icon: '🚨',
    image: 'https://via.placeholder.com/400x300?text=Emergency+Lighting',
    features: [
      'Battery backup installation',
      'Emergency light fixtures',
      'Automatic switchover',
      'Exit sign installation',
      'UPS system setup',
      'Backup power testing',
      'Annual maintenance'
    ],
    price: 800,
    duration: '3-4 hours',
    status: 'active'
  }
];

// Import data
const importServices = async () => {
  try {
    // Clear existing services
    await Service.deleteMany();
    console.log('🗑️  Existing services cleared...');

    // Insert sample services
    await Service.insertMany(services);
    console.log('✅ Services imported successfully!');

    console.log('\n🎉 Service Data Seeded!');
    console.log(`📊 Total Services: ${services.length}`);
    console.log('\n📋 Services Available:');
    services.forEach((service, idx) => {
      console.log(`  ${idx + 1}. ${service.name} - $${service.price}`);
    });

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Destroy data
const destroyServices = async () => {
  try {
    await Service.deleteMany();
    console.log('🗑️  All services deleted!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Run seeder
const runSeeder = async () => {
  try {
    await connectDB();

    if (process.argv[2] === '-d') {
      await destroyServices();
    } else {
      await importServices();
    }
  } catch (error) {
    console.error(`❌ Failed to run seeder: ${error.message}`);
    process.exit(1);
  }
};

runSeeder();
