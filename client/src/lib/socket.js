import { io } from 'socket.io-client';

import { getAccessToken } from '@/api/axiosClient';
import { config } from '@/lib/config';

let socket = null;

/**
 * Returns a singleton Socket.IO client. The access token is supplied via an
 * auth callback so each (re)connection uses the current in-memory token.
 * In dev, the Vite proxy forwards `/socket.io` to the backend, so same-origin
 * works without configuration.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(config.socketUrl || undefined, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
