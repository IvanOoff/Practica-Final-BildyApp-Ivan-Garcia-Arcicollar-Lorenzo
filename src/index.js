import http from 'node:http';
import app from './app.js';
import { dbConnect, config, mongoose } from './config/index.js';
import { configureSocket, getIO } from './config/socket.js';

let server;
let io;

const startServer = async () => {
  await dbConnect();

  server = http.createServer(app);
  io = configureSocket(server);

  server.listen(config.port, () => {
    console.log(`SERVIDOR EN http://localhost:${config.port}`);
    console.log(`ENTORNO: ${config.env}`);
    console.log(`SOCKET.IO habilitado`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recibido. Cerrando servidor...`);

  if (io) {
    io.close();
    console.log('Socket.IO cerrado');
  }

  if (server) {
    server.close(async () => {
      console.log('HTTP server cerrado');
      await mongoose.connection.close();
      console.log('MongoDB desconectado');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forzando cierre...');
      process.exit(1);
    }, 10000);
  } else {
    await mongoose.connection.close();
    process.exit(0);
  }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
