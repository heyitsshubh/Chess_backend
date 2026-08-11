import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost/auth';
const SOCKET_URL = 'http://localhost';

async function runIntegrationTest() {
  console.log('--- CHESS PLATFORM INTEGRATION TEST ---');
  
  try {
    const timestamp = Date.now().toString().slice(-6); // last 6 digits only
    const email = `testuser${timestamp}@example.com`;
    const username = `chess${timestamp}`;  // max ~11 chars
    const password = 'Password123!';

    // 1. Register User
    console.log(`\n1. Registering user: ${username}`);
    const regRes = await axios.post(`${API_URL}/register`, { email, username, password });
    console.log('Registration Response:', regRes.status, regRes.data);
    
    // 2. Login User
    console.log('\n2. Logging in...');
    const loginRes = await axios.post(`${API_URL}/login`, { email, password });
    console.log('Login Response:', loginRes.status);
    
    // We get the access token from the response (or cookie if implemented that way, but let's assume body for test if possible)
    // Wait, the API sets HTTP-only cookies for tokens. Axios won't automatically use them unless we handle headers.
    // Let's grab the set-cookie header.
    const accessToken = loginRes.data?.data?.accessToken;
    if (!accessToken) throw new Error('Access token not found in response body');
    console.log('Got Access Token (first 10 chars):', accessToken.substring(0, 10) + '...');

    const cookies = loginRes.headers['set-cookie'] || [];
    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));

    // 2.1 Test GET /auth/me
    console.log('\n2.1 Testing GET /auth/me (Protected Route)...');
    const meRes = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('GET /me Response:', meRes.status, meRes.data);

    // 2.2 Test POST /auth/refresh
    let newAccessToken = accessToken;
    if (refreshTokenCookie) {
      console.log('\n2.2 Testing POST /auth/refresh...');
      const refreshRes = await axios.post(`${API_URL}/refresh`, {}, {
        headers: { Cookie: refreshTokenCookie.split(';')[0] }
      });
      console.log('POST /refresh Response:', refreshRes.status);
      newAccessToken = refreshRes.data?.data?.accessToken || accessToken;
    }

    // 2.3 Test POST /auth/logout
    console.log('\n2.3 Testing POST /auth/logout...');
    const logoutRes = await axios.post(`${API_URL}/logout`, {}, {
      headers: { 
        Authorization: `Bearer ${newAccessToken}`,
        Cookie: refreshTokenCookie ? refreshTokenCookie.split(';')[0] : ''
      }
    });
    console.log('POST /logout Response:', logoutRes.status, logoutRes.data);

    // Re-login to get a valid token for socket test because we just logged out!
    console.log('\n2.4 Logging back in for socket test...');
    const reloginRes = await axios.post(`${API_URL}/login`, { email, password });
    const finalAccessToken = reloginRes.data?.data?.accessToken;
    if (!finalAccessToken) throw new Error('Access token not found in relogin response');

    // 3. Connect to WebSocket
    console.log('\n3. Connecting to WebSocket Game Service (via NGINX port 80)...');
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: { token: finalAccessToken }
    });

    socket.on('connect', () => {
      console.log('Socket Connected Successfully! ID:', socket.id);
      
      // 4. Test Matchmaking
      console.log('\n4. Joining Matchmaking Queue (3|0)...');
      socket.emit('matchmaking:join', '3|0');

      // Since the server doesn't send a joined callback, we just wait a bit
      setTimeout(() => {
        console.log('\n5. Leaving Matchmaking Queue...');
        socket.emit('matchmaking:leave');

        setTimeout(() => {
          console.log('\n--- ALL TESTS PASSED! ---');
          socket.disconnect();
          process.exit(0);
        }, 1000);
      }, 1000);
    });

    socket.on('error', (err) => {
      console.error('Socket Error:', err);
      process.exit(1);
    });

    // Timeout
    setTimeout(() => {
      console.error('Test timed out!');
      process.exit(1);
    }, 10000);

  } catch (err: any) {
    console.error('Test Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runIntegrationTest();
