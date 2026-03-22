const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load Product model
const Product = require('./models/Product');

// Load env vars
dotenv.config();

/**
 * PVC Pipes Product Seeder
 * Seeds MongoDB with PVC pipe products
 * Run: node seed-pipes.js
 */

// Sample PVC Pipes Product Data
const pipeProducts = [
  {
    name: 'PVC Elbow Connector 90°',
    description: 'High-quality gray PVC elbow pipe connector for 90-degree angle turns. Ideal for drainage, plumbing, and electrical conduit systems. Durable and corrosion-resistant.',
    price: 45,
    category: 'Pipes',
    brand: 'PVC Pro',
    image: 'https://via.placeholder.com/400x400?text=PVC+Elbow+90°',
    stock: 150,
    specifications: {
      color: 'Gray',
      dimensions: '½" - 2" available',
      material: 'PVC (Polyvinyl Chloride)',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.5,
      count: 128
    }
  },
  {
    name: 'PVC Ball Valve Blue Handle',
    description: 'Professional-grade PVC ball valve with blue lever handle. Perfect for water supply systems, irrigation, and general plumbing applications. Easy on/off control.',
    price: 120,
    category: 'Pipes',
    brand: 'HydroFlow',
    image: 'https://via.placeholder.com/400x400?text=PVC+Ball+Valve',
    stock: 85,
    specifications: {
      color: 'White body with blue handle',
      dimensions: '½" - 2" NPT',
      material: 'PVC body with brass ball',
      warranty: '3 Years'
    },
    ratings: {
      average: 4.7,
      count: 215
    }
  },
  {
    name: 'PVC Tee Connector',
    description: 'Standard PVC tee fitting for creating three-way pipe connections. Gray durable construction suitable for water systems, drainage, and conduit work.',
    price: 35,
    category: 'Pipes',
    brand: 'PVC Pro',
    image: 'https://via.placeholder.com/400x400?text=PVC+Tee',
    stock: 200,
    specifications: {
      color: 'Gray',
      dimensions: '½" - 2" available',
      material: 'Schedule 40 PVC',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.4,
      count: 92
    }
  },
  {
    name: 'PVC Coupling Connector',
    description: 'Simple straight coupling connector for joining two PVC pipes of equal diameter. Solvent-weld connection for permanent, leak-free joints.',
    price: 25,
    category: 'Pipes',
    brand: 'PipeLink',
    image: 'https://via.placeholder.com/400x400?text=PVC+Coupling',
    stock: 300,
    specifications: {
      color: 'White/Gray',
      dimensions: '½" - 3" available',
      material: 'Schedule 40 PVC',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.6,
      count: 156
    }
  },
  {
    name: 'PVC Threaded Adapters Set',
    description: 'Complete set of PVC threaded adapters for male and female NPT connections. Essential for converting between pipe sizes and connecting to fixtures. 8-piece comprehensive set.',
    price: 180,
    category: 'Pipes',
    brand: 'Complete Plumbing Solutions',
    image: 'https://via.placeholder.com/400x400?text=PVC+Adapters+Set',
    stock: 60,
    specifications: {
      color: 'Gray',
      dimensions: '½" to 2" NPT',
      material: 'PVC with brass inserts',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.8,
      count: 187
    }
  },
  {
    name: 'PVC End Cap Plugs',
    description: 'Solvent-weld end caps for sealing PVC pipe ends. Available in various sizes. Weather-resistant gray color for outdoor applications.',
    price: 15,
    category: 'Pipes',
    brand: 'PVC Pro',
    image: 'https://via.placeholder.com/400x400?text=PVC+End+Cap',
    stock: 400,
    specifications: {
      color: 'Gray',
      dimensions: '½" - 3" available',
      material: 'Schedule 40 PVC',
      warranty: '1 Year'
    },
    ratings: {
      average: 4.3,
      count: 78
    }
  },
  {
    name: 'PVC Pipe Assortment Bundle',
    description: 'Complete assortment of PVC pipes and fittings in various sizes and styles. Includes elbows, tees, couplings, adapters, and caps. Perfect starter kit for plumbing projects.',
    price: 550,
    category: 'Pipes',
    brand: 'Complete Plumbing Solutions',
    image: 'https://via.placeholder.com/400x400?text=PVC+Assortment+Bundle',
    stock: 45,
    specifications: {
      color: 'Gray/White',
      dimensions: 'Multiple sizes ½" to 3"',
      material: 'PVC + brass components',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.9,
      count: 342
    }
  },
  {
    name: 'PVC Straight Pipe 10ft Length',
    description: 'Standard straight PVC pipe in 10-foot lengths. Schedule 40 for reliable performance in water supply, drainage, and conduit systems. Cut to custom sizes available.',
    price: 95,
    category: 'Pipes',
    brand: 'PipeLink',
    image: 'https://via.placeholder.com/400x400?text=PVC+Straight+Pipe',
    stock: 120,
    specifications: {
      color: 'White/Gray',
      dimensions: '1" - 4" diameter × 10 feet',
      material: 'Schedule 40 PVC',
      warranty: '2 Years'
    },
    ratings: {
      average: 4.5,
      count: 205
    }
  }
];

/**
 * Connect to database and seed pipes data
 */
async function seedPipes() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing pipe products (optional - comment out to keep existing)
    // await Product.deleteMany({ category: 'Pipes' });
    // console.log('🗑️  Cleared existing pipe products');

    // Insert new pipe products
    const insertedProducts = await Product.insertMany(pipeProducts);
    console.log(`✅ Successfully inserted ${insertedProducts.length} pipe products!`);

    // Display inserted products
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ₹${product.price}`);
    });

    console.log('\n✨ Pipe products seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pipe products:', error.message);
    process.exit(1);
  }
}

// Run the seeder
seedPipes();
