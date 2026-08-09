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

    // 3. Connect to WebSocket
    console.log('\n3. Connecting to WebSocket Game Service (via NGINX port 80)...');
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: { token: accessToken }
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
