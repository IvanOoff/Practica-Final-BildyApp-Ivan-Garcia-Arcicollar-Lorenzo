// CONESIÓN A MONGODB.
import mongoose from 'mongoose';

export const dbConnect = async () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    console.error('ERROR -> DB_URI no está configurada');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('CONECTADO A MONGODB');
  } catch (error) {
    console.error('ERROR conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Detectamos la desconexión.
mongoose.connection.on('disconnected', () => {
  console.warn('Desconectado de MongoDB....');
});

// Detectamos los errores.
mongoose.connection.on('error', (err) => {
  console.error('Error en MongoDB:', err.message);
});

export { mongoose };
export default dbConnect;