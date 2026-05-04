import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass
  }
});

export const sendVerificationEmail = async (to, code) => {
  if (!config.smtpHost || !config.smtpUser) {
    console.warn('SMTP no configurado, omitiendo envío de email');
    return;
  }

  const mailOptions = {
    from: config.emailFrom,
    to,
    subject: 'Código de verificación - BildyApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">BildyApp - Verificación de email</h1>
        <p>Tu código de verificación es:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; margin: 20px 0;">
          <strong>${code}</strong>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expira en 15 minutos.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">No compartas este código con nadie.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de verificación enviado a ${to}`);
  } catch (error) {
    console.error('Error enviando email:', error.message);
  }
};

export const sendDeliveryNoteSigned = async (to, deliveryNote) => {
  if (!config.smtpHost || !config.smtpUser) {
    console.warn('SMTP no configurado, omitiendo envío de email');
    return;
  }

  const mailOptions = {
    from: config.emailFrom,
    to,
    subject: `Albarán ${deliveryNote.sequentialNumber} firmado - BildyApp`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Albarán Firmado</h1>
        <p>El albarán <strong>${deliveryNote.sequentialNumber}</strong> ha sido firmado.</p>
        <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${deliveryNote.client?.name || 'N/A'}</p>
          <p><strong>Proyecto:</strong> ${deliveryNote.project?.name || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${new Date(deliveryNote.workDate).toLocaleDateString()}</p>
        </div>
        <p>El PDF firmado está disponible en su área de cliente.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">BildyApp - Gestión de Albaranes</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error enviando email:', error.message);
  }
};

export default { sendVerificationEmail, sendDeliveryNoteSigned };
