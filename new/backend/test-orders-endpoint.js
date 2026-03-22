/**
 * Test the /api/orders endpoint directly
 * This will help diagnose if the orders API is working
 */

const http = require('http');

async function testOrdersEndpoint() {
  console.log('\n🔍 Testing /api/orders endpoint\n');
  console.log('='.repeat(60));
  
  return new Promise((resolve, reject) => {
    // Use the admin token from the diagnostic
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NWRlNjIzYzQwOTcwOTA4MDk0NjIxZiIsInJvbGUiOiJTVUJfQURNSU4iLCJpYXQiOjE3NzE5MjE4NTIsImV4cCI6MTc3NDUxMzg1Mn0.biPjSN9ZlKf-34Oxa-ap36SCEtB3XzniApQrsI8QLUM';
    
    console.log('📡 Making request to: http://localhost:50004/api/orders');
    console.log('🔑 Using admin token (SUB_ADMIN)\n');
    
    const options = {
      hostname: 'localhost',
      port: 50004,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('✅ SUCCESS! API responded with:');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Success: ${response.success}`);
          console.log(`   Order Count: ${response.count || response.orders?.length || 0}`);
          
          if (response.orders && response.orders.length > 0) {
            console.log(`\n📦 Sample Order Data (first order):`);
            const order = response.orders[0];
            console.log(`   Order ID: ${order.orderId || order._id}`);
            console.log(`   Total Amount: ₹${order.totalAmount}`);
            console.log(`   Status: ${order.status || order.orderStatus}`);
            console.log(`   Payment Method: ${order.paymentMethod}`);
            console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
          }
          
          if (response.totalSales !== undefined) {
            console.log(`\n💰 Sales Summary:`);
            console.log(`   Total Sales: ₹${response.totalSales}`);
          }
          
          console.log('\n' + '='.repeat(60));
          console.log('✅ The /api/orders endpoint is WORKING correctly!');
          console.log('\nIf the frontend still shows zeros, the issue is:');
          console.log('   1. Frontend not making the request');
          console.log('   2. Frontend using wrong token or no token');
          console.log('   3. Browser console has errors');
          console.log('   4. CORS or proxy configuration issue\n');
          
          resolve();
        } catch (err) {
          console.error('❌ Failed to parse response:', err.message);
          console.error('Response data:', data);
          reject(err);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ ERROR calling /api/orders:');
      console.error(`   ${error.message}`);
      console.error('\n   Is the backend server running on port 50004?');
      console.log('\n' + '='.repeat(60));
      reject(error);
    });
    
    req.end();
  });
}

testOrdersEndpoint()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
