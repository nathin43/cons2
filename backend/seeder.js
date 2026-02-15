const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load models
const User = require('./models/User');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

// Load env vars
dotenv.config();

/**
 * Sample Data Seeder
 * Seeds MongoDB with demo admin, customer, and product data
 * Run: npm run seed
 */

// Sample Admin Data
const admins = [
  {
    name: 'Mani Admin',
    email: 'manielectricals@gmail.com',
    password: 'Mani1234',
    role: 'MAIN_ADMIN',
    permissions: {
      canManageProducts: true,
      canManageOrders: true,
      canManageCustomers: true,
      canViewDashboard: true
    }
  },
  {
    name: 'Sub Admin',
    email: 'subadmin@electricshop.com',
    password: 'SubAdmin123',
    role: 'SUB_ADMIN',
    permissions: {
      canManageProducts: true,
      canManageOrders: true,
      canManageCustomers: true,
      canViewDashboard: true
    }
  }
];

// Sample Customer Data
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '9876543210',
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '9876543211',
    address: {
      street: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    }
  }
];

// Sample Product Data
const products = [
  {
    name: 'Polycab FR Wire 2.5 sq mm - 90m',
    description: 'High quality flame retardant electrical wire suitable for domestic and commercial wiring.',
    price: 2499,
    category: 'Wire & Cables',
    brand: 'Polycab',
    image: '/uploads/products/sample-tv.jpg',
    stock: 15,
    specifications: {
      power: '120W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'Black',
      dimensions: '55 inches'
    },
    ratings: { average: 4.5, count: 120 },
    featured: true
  },
  {
    name: 'Havells 4 Core Flexible Cable - 1100m',
    description: 'Multi-core flexible cable ideal for home and industrial applications.',
    price: 4599,
    category: 'Wire & Cables',
    brand: 'Havells',
    image: '/uploads/products/sample-tv.jpg',
    stock: 8,
    specifications: {
      power: '150W',
      voltage: '220-240V',
      warranty: '2 Years',
      color: 'Black',
      dimensions: '65 inches'
    },
    ratings: { average: 4.8, count: 89 },
    featured: true
  },
  {
    name: 'Havells Ceiling Fan 1200mm',
    description: 'Energy efficient ceiling fan with high air delivery and elegant design.',
    price: 2499,
    category: 'Fan',
    brand: 'Havells',
    image: '/uploads/products/sample-fan.jpg',
    stock: 50,
    specifications: {
      power: '75W',
      voltage: '220-240V',
      warranty: '2 Years',
      color: 'Brown',
      dimensions: '1200mm'
    },
    ratings: { average: 4.3, count: 256 }
  },
  {
    name: 'Usha Table Fan 400mm',
    description: 'Compact and powerful table fan with 3-speed control and oscillation.',
    price: 1799,
    category: 'Fan',
    brand: 'Usha',
    image: '/uploads/products/sample-fan.jpg',
    stock: 35,
    specifications: {
      power: '55W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'White',
      dimensions: '400mm'
    },
    ratings: { average: 4.1, count: 178 }
  },
  {
    name: 'Astral CPVC Pipes 15mm - 3m',
    description: 'High quality CPVC pipes for hot and cold water supply. ISI certified.',
    price: 399,
    category: 'Pipes',
    brand: 'Astral',
    image: '/uploads/products/sample-ac.jpg',
    stock: 12,
    specifications: {
      power: '1500W',
      voltage: '220-240V',
      warranty: '5 Years Compressor',
      color: 'White',
      dimensions: '1.5 Ton'
    },
    ratings: { average: 4.6, count: 145 },
    featured: true
  },
  {
    name: 'Supreme PVC Pipes 20mm - 6m',
    description: 'Durable PVC pipes for plumbing and drainage applications.',
    price: 599,
    category: 'Pipes',
    brand: 'Supreme',
    image: '/uploads/products/sample-ac.jpg',
    stock: 20,
    specifications: {
      power: '1200W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'White',
      dimensions: '1 Ton'
    },
    ratings: { average: 4.2, count: 98 }
  },
  {
    name: 'Crompton 1HP Single Phase Motor',
    description: 'High efficiency single phase motor suitable for domestic and agricultural use.',
    price: 8990,
    category: 'Motors',
    brand: 'LG',
    image: '/uploads/products/sample-washing-machine.jpg',
    stock: 18,
    specifications: {
      power: '2000W',
      voltage: '220-240V',
      warranty: '2 Years',
      color: 'Silver',
      dimensions: '7kg capacity'
    },
    ratings: { average: 4.4, count: 187 },
    featured: true
  },
  {
    name: 'Havells 0.5HP Submersible Motor',
    description: 'Compact submersible motor for borewell and open well applications.',
    price: 6990,
    category: 'Motors',
    brand: 'Havells',
    image: '/uploads/products/sample-washing-machine.jpg',
    stock: 25,
    specifications: {
      power: '460W',
      voltage: '220-240V',
      warranty: '2 Years',
      color: 'Grey',
      dimensions: '6.5kg capacity'
    },
    ratings: { average: 4.0, count: 234 }
  },
  {
    name: 'Crompton 25L Instant Heater',
    description: 'Instant water heater with auto cut-off and rust-proof body. Energy efficient.',
    price: 7999,
    category: 'Heater',
    brand: 'Crompton',
    image: '/uploads/products/sample-fridge.jpg',
    stock: 22,
    specifications: {
      power: '150W',
      voltage: '220-240V',
      warranty: '1 Year + 10 Years Compressor',
      color: 'Silver',
      dimensions: '253 Litres'
    },
    ratings: { average: 4.3, count: 312 },
    featured: true
  },
  {
    name: 'Havells 15L Storage Heater',
    description: 'Compact storage water heater with temperature control and safety valve.',
    price: 5990,
    category: 'Heater',
    brand: 'Havells',
    image: '/uploads/products/sample-fridge.jpg',
    stock: 30,
    specifications: {
      power: '100W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'Blue',
      dimensions: '190 Litres'
    },
    ratings: { average: 4.1, count: 156 }
  },
  {
    name: 'Philips 9W LED Bulb Pack of 4',
    description: 'Energy saving LED bulbs with cool daylight. 90% energy saving vs incandescent.',
    price: 599,
    category: 'Lights',
    brand: 'Philips',
    image: '/uploads/products/sample-bulb.jpg',
    stock: 100,
    specifications: {
      power: '9W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'Cool White'
    },
    ratings: { average: 4.5, count: 445 }
  },
  {
    name: 'Syska 12W LED Tubelight',
    description: 'T-bulb LED tube light with high lumens output. Instant start.',
    price: 349,
    category: 'Lights',
    brand: 'Syska',
    image: '/uploads/products/sample-tube.jpg',
    stock: 150,
    specifications: {
      power: '12W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'Cool White'
    },
    ratings: { average: 4.2, count: 289 }
  },
  {
    name: 'Anchor Modular Switch 6A - Pack of 10',
    description: 'Premium quality switches with superior finish. Easy installation.',
    price: 899,
    category: 'Switches',
    brand: 'Anchor',
    image: '/uploads/products/sample-switch.jpg',
    stock: 200,
    specifications: {
      power: '6A',
      voltage: '240V',
      warranty: '1 Year',
      color: 'White'
    },
    ratings: { average: 4.4, count: 567 }
  },
  {
    name: 'GM Modular Switch Board 8 Module',
    description: 'Complete switch board with 8 module capacity. Modern design.',
    price: 1299,
    category: 'Switches',
    brand: 'GM',
    image: '/uploads/products/sample-switchboard.jpg',
    stock: 75,
    specifications: {
      voltage: '240V',
      warranty: '2 Years',
      color: 'White',
      dimensions: '8 Module'
    },
    ratings: { average: 4.3, count: 178 }
  },
  {
    name: 'Sintex 500L Water Tank',
    description: 'High quality plastic water storage tank with UV protection. Durable and leak-proof.',
    price: 4990,
    category: 'Tank',
    brand: 'Sintex',
    image: '/uploads/products/sample-microwave.jpg',
    stock: 28,
    specifications: {
      power: '1200W',
      voltage: '220-240V',
      warranty: '1 Year',
      color: 'Black',
      dimensions: '20 Litres'
    },
    ratings: { average: 4.2, count: 134 }
  },
  {
    name: 'Bajaj 25L Storage Water Heater',
    description: 'Electric water heater with advanced 4-level safety. Rust-proof body.',
    price: 8499,
    category: 'Heater',
    brand: 'Bajaj',
    image: '/uploads/products/sample-heater.jpg',
    stock: 32,
    specifications: {
      power: '2000W',
      voltage: '220-240V',
      warranty: '2 Years',
      color: 'White',
      dimensions: '25 Litres'
    },
    ratings: { average: 4.3, count: 198 }
  }
];

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await Admin.deleteMany();
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();

    console.log('🗑️  Data Destroyed...');

    // Insert sample data (using .create() to trigger password hashing middleware)
    await Admin.create(admins);
    console.log('✅ Admins imported');

    await User.create(users);
    console.log('✅ Users imported');

    await Product.insertMany(products);
    console.log('✅ Products imported');

    console.log('\n🎉 Data Imported Successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log('  Email: admin@electricshop.com');
    console.log('  Password: admin123');
    console.log('\nCustomer Login:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

// Destroy data
const destroyData = async () => {
  try {
    await Admin.deleteMany();
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();

    console.log('🗑️  Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

// Run seeder
const runSeeder = async () => {
  try {
    // Connect to database
    await connectDB();
    
    if (process.argv[2] === '-d') {
      await destroyData();
    } else {
      await importData();
    }
  } catch (error) {
    console.error(`❌ Failed to run seeder: ${error.message}`);
    process.exit(1);
  }
};

runSeeder();
