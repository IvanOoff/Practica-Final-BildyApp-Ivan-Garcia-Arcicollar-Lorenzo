import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Token no proporcionado'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
};

export default socketAuthMiddleware;
