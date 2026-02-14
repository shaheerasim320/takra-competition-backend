const http = require('http');

const cleanDB = async () => {
    // Optional: add logic to clear test user if needed, or just use unique email
};

const makeRequest = (options, body = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    const timestamp = Date.now();
    const testUser = {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'Password123!'
    };

    console.log('--- Starting Auth Verification ---');
    console.log(`Test User: ${testUser.email}`);

    // 1. Register
    console.log('\n1. Testing Registration...');
    const regRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, testUser);

    if (regRes.statusCode === 201) {
        console.log('✅ Registration Successful');
    } else {
        console.error('❌ Registration Failed:', regRes.statusCode, regRes.body);
        return;
    }

    // 2. Login
    console.log('\n2. Testing Login...');
    const loginRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: testUser.email, password: testUser.password });

    let accessToken = loginRes.body.accessToken;
    let cookies = loginRes.headers['set-cookie'];

    if (loginRes.statusCode === 200 && accessToken) {
        console.log('✅ Login Successful');
        console.log('Access Token received');
        if (cookies) console.log('Cookies received:', cookies.length);
    } else {
        console.error('❌ Login Failed:', loginRes.statusCode, loginRes.body);
        return;
    }

    // 3. Get Me (Protected Route)
    console.log('\n3. Testing Protected Route (/api/auth/me)...');
    const meRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (meRes.statusCode === 200 && meRes.body.user.email === testUser.email) {
        console.log('✅ Protected Route Access Successful');
        console.log('User:', meRes.body.user.email);
    } else {
        console.error('❌ Protected Route Failed:', meRes.statusCode, meRes.body);
    }

    // 4. Logout
    console.log('\n4. Testing Logout...');
    const logoutRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/logout',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    if (logoutRes.statusCode === 200) {
        console.log('✅ Logout Successful');
        // Check if cookies are cleared (set-cookie should have older dates or empty values)
        const clearCookies = logoutRes.headers['set-cookie'];
        if (clearCookies) {
            console.log('Cookies cleared');
        }
    } else {
        console.error('❌ Logout Failed:', logoutRes.statusCode, logoutRes.body);
    }

    console.log('\n--- Verification Complete ---');
};

runTests().catch(console.error);
