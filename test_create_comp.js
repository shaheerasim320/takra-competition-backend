const http = require('http');

const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : {} });
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  try {
     console.log('\n--- Testing POST /api/competitions (Create) ---');
     // 1. Need a valid category
     const categories = await makeRequest('/api/categories');
     if(categories.body.length === 0) {
         console.log("No categories found, creating one...");
         const newCat = await makeRequest('/api/categories', 'POST', { name: "TestCat_" + Date.now() });
         categories.body.push(newCat.body);
     }
     const categoryId = categories.body[0]._id;

     // 2. Need a user ID (simulating)
     const fakeUserId = "507f1f77bcf86cd799439011"; // Valid Mongo ID format

     const newCompData = {
         title: "New Challenge " + Date.now(),
         description: "A test competition",
         category: categoryId,
         rules: "Be nice",
         startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
         endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
         registrationDeadline: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
         userId: fakeUserId
     };

     // Note: This might fail with 404 if the user doesn't exist in DB. 
     // Since we haven't implemented Create User endpoint and seeded data is unknown,
     // we expect either 201 (if user exists) or 404 (User not found).
     // We are verifying the Endpoint is reachable and logic executes.

     const res = await makeRequest('/api/competitions', 'POST', newCompData);
     console.log('Status:', res.statusCode);
     console.log('Body:', res.body);

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
};

runTests();
