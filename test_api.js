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
    console.log('--- Testing GET /api/categories ---');
    const categories = await makeRequest('/api/categories');
    console.log('Status:', categories.statusCode);
    if (categories.statusCode === 200) {
        console.log('Body:', categories.body.length, 'categories found');
    } else {
        console.log('Body:', categories.body);
    }
    
    // Create a category
     console.log('\n--- Testing POST /api/categories ---');
     const newCategory = await makeRequest('/api/categories', 'POST', {
       name: 'TestCategory_' + Date.now(),
       description: 'A test category'
     });
     console.log('Status:', newCategory.statusCode);
     console.log('Body:', newCategory.body);
     const categoryId = newCategory.body._id;

     if(categoryId) {
         // Create Competition (simulation since we dont have a route for creating competition yet, assuming usage of Compass or similar, 
         // but wait, we need to test GET competitions. If there are none, we get empty list.
         // We didn't implement createCompetition endpoint in previous steps, only get and sort.
         // Effectively testing GET competitions now.
         console.log('\n--- Testing GET /api/competitions ---');
         const competitions = await makeRequest('/api/competitions');
         console.log('Status:', competitions.statusCode);
         // console.log('Body:', competitions.body);
         
         // To test registration we need a valid competition ID.
         // Since we can't create one via API (not required by user task instructions to create "Create Competition" endpoint, only "Browse & View" and "Register"),
         // I cannot fully automate "Register" test without seeding DB.
         // However, I can try to register with a fake ID and expect 404.
         console.log('\n--- Testing POST /api/competitions/fake_id/register ---');
         const reg = await makeRequest('/api/competitions/507f1f77bcf86cd799439011/register', 'POST', { userId: '507f1f77bcf86cd799439011' });
         console.log('Status:', reg.statusCode);
         console.log('Body:', reg.body); // Should be 404 (Competition not found) or 500
     }

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
};

runTests();
