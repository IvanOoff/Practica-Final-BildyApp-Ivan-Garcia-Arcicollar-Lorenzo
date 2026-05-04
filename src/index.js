import app from './app.js';
import { dbConnect, config, mongoose } from './config/index.js';

let server;

const startServer = async () => {
  await dbConnect();
  server = app.listen(config.port, () => {
    console.log(`SERVIDOR EN http://localhost:${config.port}`);
    console.log(`ENTORNO: ${config.env}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recibido. Cerrando servidor...`);

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
