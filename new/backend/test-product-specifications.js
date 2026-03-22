/**
 * Test Script for Dynamic Product Specification System
 * Tests the specification schema endpoints and product CRUD with specifications
 */

const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n${colors.magenta}${msg}${colors.reset}\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n`)
};

let testProductId = null;

/**
 * Test 1: Get All Specification Schemas
 */
async function testGetAllSchemas() {
  log.test('Test 1: GET /products/specifications/schemas');
  try {
    const response = await axios.get(`${BASE_URL}/products/specifications/schemas`);
    
    if (response.data.success && response.data.schemas) {
      log.success('Retrieved all specification schemas');
      log.info(`Categories available: ${response.data.categories.join(', ')}`);
      
      // Display one schema as sample
      const sampleCategory = 'Fan';
      const sampleSchema = response.data.schemas[sampleCategory];
      log.info(`Sample schema for "${sampleCategory}":`);
      console.log(`  Required fields: ${sampleSchema.required.length}`);
      console.log(`  Optional fields: ${sampleSchema.optional.length}`);
      sampleSchema.required.slice(0, 2).forEach(field => {
        console.log(`    - ${field.label} (${field.type})`);
      });
      
      return true;
    } else {
      log.error('Invalid response structure');
      return false;
    }
  } catch (error) {
    log.error(`Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Get Specification Schema for Specific Category
 */
async function testGetCategorySchema() {
  log.test('Test 2: GET /products/specifications/schemas/:category');
  
  const testCategories = ['Lights', 'Motors', 'Wire & Cables'];
  let allPassed = true;
  
  for (const category of testCategories) {
    try {
      const response = await axios.get(`${BASE_URL}/products/specifications/schemas/${encodeURIComponent(category)}`);
      
      if (response.data.success && response.data.schema) {
        log.success(`Retrieved schema for "${category}"`);
        console.log(`  Icon: ${response.data.schema.icon}`);
        console.log(`  Required: ${response.data.schema.required.length} fields`);
        console.log(`  Optional: ${response.data.schema.optional.length} fields`);
      } else {
        log.error(`Invalid response for category: ${category}`);
        allPassed = false;
      }
    } catch (error) {
      log.error(`Failed for "${category}": ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Test 3: Create Product with Specifications
 */
async function testCreateProductWithSpecs() {
  log.test('Test 3: POST /products (with specifications)');
  
  try {
    // Create a Fan product with specifications
    const productData = {
      name: 'Test Ceiling Fan with Specs',
      description: 'High-performance ceiling fan with advanced specifications',
      price: 2999,
      category: 'Fan',
      brand: 'TestBrand',
      stock: 50,
      image: '/uploads/products/test-fan.jpg',
      specifications: {
        bladeSize: 48,
        sweep: 1200,
        speedRpm: 350,
        powerConsumption: 75,
        mountType: 'Ceiling',
        warranty: '2 Years'
      }
    };
    
    const response = await axios.post(`${BASE_URL}/products`, productData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.product) {
      testProductId = response.data.product._id;
      log.success('Created product with specifications');
      log.info(`Product ID: ${testProductId}`);
      log.info('Specifications stored:');
      Object.entries(response.data.product.specifications).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      return true;
    } else {
      log.error('Invalid response structure');
      return false;
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 4: Get Product with Specifications
 */
async function testGetProductWithSpecs() {
  log.test('Test 4: GET /products/:id (with specifications)');
  
  if (!testProductId) {
    log.error('No test product ID available. Skipping test.');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/products/${testProductId}`);
    
    if (response.data.success && response.data.product) {
      log.success('Retrieved product with specifications');
      
      const specs = response.data.product.specifications;
      if (specs && typeof specs === 'object') {
        log.info(`Specifications retrieved: ${Object.keys(specs).length} fields`);
        Object.entries(specs).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        return true;
      } else {
        log.error('Specifications not found or invalid');
        return false;
      }
    } else {
      log.error('Invalid response structure');
      return false;
    }
  } catch (error) {
    log.error(`Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Update Product Specifications
 */
async function testUpdateProductSpecs() {
  log.test('Test 5: PUT /products/:id (update specifications)');
  
  if (!testProductId) {
    log.error('No test product ID available. Skipping test.');
    return false;
  }
  
  try {
    // Update with modified specifications
    const updatedData = {
      specifications: {
        bladeSize: 52, // Changed from 48
        sweep: 1320, // Changed from 1200
        speedRpm: 400, // Changed from 350
        powerConsumption: 80, // Changed from 75
        mountType: 'Ceiling',
        warranty: '3 Years' // Changed from 2 Years
      }
    };
    
    const response = await axios.put(`${BASE_URL}/products/${testProductId}`, updatedData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.product) {
      log.success('Updated product specifications');
      log.info('Updated specifications:');
      Object.entries(response.data.product.specifications).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      return true;
    } else {
      log.error('Invalid response structure');
      return false;
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 6: Test Multiple Categories
 */
async function testMultipleCategories() {
  log.test('Test 6: Test specifications for multiple categories');
  
  const categoryTests = [
    {
      category: 'Lights',
      specifications: {
        lightType: 'LED',
        wattage: 12,
        colorTemperature: 'Warm White (3000K)',
        lumens: 800,
        warranty: '1 Year'
      }
    },
    {
      category: 'Motors',
      specifications: {
        powerHp: '1 HP',
        voltage: '220V',
        phase: 'Single Phase',
        rpm: 1440,
        insulationClass: 'Class F',
        warranty: '1 Year'
      }
    },
    {
      category: 'Wire & Cables',
      specifications: {
        coreType: 'Multi Core',
        wireGauge: '2.5 sq mm',
        length: 90,
        conductorMaterial: 'Copper',
        insulationType: 'PVC',
        voltageRating: '1100V',
        isiCertified: 'Yes'
      }
    }
  ];
  
  let allPassed = true;
  const createdIds = [];
  
  for (const test of categoryTests) {
    try {
      const productData = {
        name: `Test ${test.category} Product`,
        description: `Test product for ${test.category} category`,
        price: 999,
        category: test.category,
        brand: 'TestBrand',
        stock: 10,
        image: '/uploads/products/test.jpg',
        specifications: test.specifications
      };
      
      const response = await axios.post(`${BASE_URL}/products`, productData, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success && response.data.product) {
        createdIds.push(response.data.product._id);
        log.success(`Created "${test.category}" product with ${Object.keys(test.specifications).length} specifications`);
      } else {
        log.error(`Failed to create product for category: ${test.category}`);
        allPassed = false;
      }
    } catch (error) {
      log.error(`Failed for "${test.category}": ${error.response?.data?.message || error.message}`);
      allPassed = false;
    }
  }
  
  // Clean up created test products
  for (const id of createdIds) {
    try {
      await axios.delete(`${BASE_URL}/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
        }
      });
    } catch (error) {
      log.error(`Failed to delete test product ${id}: ${error.message}`);
    }
  }
  
  return allPassed;
}

/**
 * Clean up test data
 */
async function cleanup() {
  log.test('Cleanup: Removing test product');
  
  if (!testProductId) {
    log.info('No test product to clean up');
    return;
  }
  
  try {
    await axios.delete(`${BASE_URL}/products/${testProductId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      }
    });
    log.success('Test product deleted successfully');
  } catch (error) {
    log.error(`Failed to delete test product: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log.header('DYNAMIC PRODUCT SPECIFICATION SYSTEM - TEST SUITE');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Get All Schemas', fn: testGetAllSchemas },
    { name: 'Get Category Schema', fn: testGetCategorySchema },
    { name: 'Create Product with Specs', fn: testCreateProductWithSpecs },
    { name: 'Get Product with Specs', fn: testGetProductWithSpecs },
    { name: 'Update Product Specs', fn: testUpdateProductSpecs },
    { name: 'Test Multiple Categories', fn: testMultipleCategories }
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log(''); // Empty line between tests
  }
  
  // Cleanup
  await cleanup();
  
  // Final report
  log.header('TEST RESULTS');
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed === 0) {
    log.success('All tests passed! ✨');
  } else {
    log.error(`${results.failed} test(s) failed. Please review the output above.`);
  }
  
  process.exit(results.failed);
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});
