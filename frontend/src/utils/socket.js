import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

const socket = io(API_BASE_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;
