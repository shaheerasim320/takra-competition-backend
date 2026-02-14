const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api-docs/',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  // We expect 200 OK and HTML content
  if (res.statusCode === 200) {
      console.log("Swagger UI is accessible.");
  } else {
      console.log("Failed to access Swagger UI.");
  }
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
