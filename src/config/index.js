// INDEX -> Configuración centralizada.
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  dbUri: process.env.DB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM || 'noreply@bildyapp.com'
};

const dbConnect = async () => {
  if (!config.dbUri) {
    console.error('ERROR');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.dbUri);
    console.log('CONECTADO A MONGODB');
  } catch (error) {
    console.error('ERROR conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('Desconectado de MongoDB....');
});

mongoose.connection.on('error', (err) => {
  console.error('Error en MongoDB:', err.message);
});

export { config, dbConnect, mongoose };
export default config;
