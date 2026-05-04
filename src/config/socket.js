import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socket-auth.middleware.js';
import { registerDeliveryNoteHandlers } from '../handlers/socket.handler.js';

let io;

export const configureSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}, usuario: ${socket.user?._id}`);

    registerDeliveryNoteHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado');
  }
  return io;
};

export default { configureSocket, getIO };
