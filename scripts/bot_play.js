const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://192.168.29.180';

async function startBot() {
  try {
    const timestamp = Date.now();
    const email = `bot_${timestamp}@chess.local`;
    const username = `ChessBot_${timestamp.toString().slice(-4)}`;
    const password = 'Password123!';

    console.log(`[Bot] Registering bot user: ${username}...`);
    await axios.post(`${API_URL}/auth/register`, { email, username, password });

    console.log(`[Bot] Logging in...`);
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
    const token = loginRes.data.data.accessToken;

    console.log(`[Bot] Connecting to Socket.IO gateway at ${API_URL}...`);
    const socket = io(API_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: { token }
    });

    socket.on('connect', () => {
      console.log(`[Bot] Connected (socket ID: ${socket.id}). Joining 3|0 matchmaking queue...`);
      socket.emit('matchmaking:join', '3|0');
    });

    socket.on('matchmaking:matched', (data) => {
      console.log(`🎉 [Bot] MATCHED! Game ID: ${data.gameId}`);
      console.log(`[Bot] Playing as ${data.white.userId === token ? 'WHITE' : 'BLACK'} against ${data.white.username} vs ${data.black.username}`);
    });

    socket.on('game:move_made', () => {
      console.log(`[Bot] Opponent made a move.`);
    });

    socket.on('game:end', (data) => {
      console.log(`[Bot] Game ended! Winner: ${data.winner}, Reason: ${data.reason}`);
      socket.disconnect();
      process.exit(0);
    });

    socket.on('connect_error', (err) => {
      console.error('[Bot] Connection error:', err.message);
    });
  } catch (err) {
    console.error('[Bot] Error:', err.response?.data || err.message);
  }
}

startBot();
