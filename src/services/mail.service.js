// Para los emails.,

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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 50px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">BildyApp</h1>
          <p style="color: #c4b5fd; margin: 15px 0 0 0; font-size: 16px;">Verificación de email</p>
        </div>
        <div style="background: #1e1e3f; padding: 50px 40px;">
          <p style="color: #e0e7ff; font-size: 18px; margin: 0 0 10px 0;">Hola! 👋</p>
          <p style="color: #a5b4fc; font-size: 15px; margin: 0 0 30px 0;">Introduce el siguiente código para verificar tu email:</p>
          <div style="background: #2d2d5a; border: 2px solid #6366f1; padding: 30px; text-align: center; margin: 30px 0; border-radius: 16px;">
            <span style="color: #a855f7; font-size: 42px; font-weight: 800; letter-spacing: 12px;">${code}</span>
          </div>
          <p style="color: #818cf8; font-size: 14px; text-align: center; margin: 0 0 10px 0;">⏱️ Este código expira en <strong>15 minutos</strong></p>
          <div style="background: #3730a3; padding: 20px; border-radius: 12px; margin: 30px 0 20px 0; text-align: center;">
            <p style="color: #c7d2fe; font-size: 13px; margin: 0;">🔒 Si no solicitaste este código, puedes ignorar este email de forma segura.</p>
          </div>
        </div>
        <div style="background: #0f0f23; padding: 25px; text-align: center; border-top: 1px solid #3730a3;">
          <p style="color: #6366f1; font-size: 12px; margin: 0;">© 2024 BildyApp - Gestión de Albaranes Digitales</p>
        </div>
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 50px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">BildyApp</h1>
          <p style="color: #d1fae5; margin: 15px 0 0 0; font-size: 16px;">✅ Albarán Firmado</p>
        </div>
        <div style="background: #1e1e3f; padding: 50px 40px;">
          <div style="background: linear-gradient(135deg, #05966920 0%, #10b98120 100%); border-left: 5px solid #10b981; padding: 25px; margin-bottom: 30px; border-radius: 0 14px 14px 0;">
            <h2 style="color: #34d399; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Albarán ${deliveryNote.sequentialNumber}</h2>
            <p style="color: #6ee7b7; margin: 0; font-size: 15px;">🎉 ¡Firmado correctamente!</p>
          </div>
          <div style="background: #1c1c3e; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #05966930;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6ee7b7; font-size: 13px; padding: 12px 0; border-bottom: 1px solid #05966930;"><strong>👤 Cliente:</strong></td>
                <td style="color: #d1fae5; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #05966930;">${deliveryNote.client?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #6ee7b7; font-size: 13px; padding: 12px 0; border-bottom: 1px solid #05966930;"><strong>📁 Proyecto:</strong></td>
                <td style="color: #d1fae5; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #05966930;">${deliveryNote.project?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #6ee7b7; font-size: 13px; padding: 12px 0;"><strong>📅 Fecha:</strong></td>
                <td style="color: #d1fae5; font-size: 15px; padding: 12px 0;">${new Date(deliveryNote.workDate).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          <div style="background: #065f46; padding: 22px; border-radius: 12px; margin: 30px 0 20px 0; text-align: center;">
            <p style="color: #a7f3d0; font-size: 14px; margin: 0;">📄 El PDF firmado está disponible en su área de cliente</p>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #6ee7b7; font-size: 13px; margin: 0;">💬 ¿Tienes alguna pregunta? Responde a este email y te ayudaremos</p>
          </div>
        </div>
        <div style="background: #0f0f23; padding: 25px; text-align: center; border-top: 1px solid #05966930;">
          <p style="color: #10b981; font-size: 12px; margin: 0;">© 2024 BildyApp - Gestión de Albaranes Digitales</p>
        </div>
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