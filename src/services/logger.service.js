// Logger con slack -> envía un mensaje a un canal de Slack con los detalles,

import { config } from '../config/index.js';

export const logErrorToSlack = async (error, req = null) => {
  if (!config.slackWebhookUrl) {
    console.warn('El SLACK_WEBHOOK_URL no está configurado..');
    return;
  }

  const timestamp = new Date().toISOString();
  const method = req?.method || 'N/A';
  const url = req?.originalUrl || req?.url || 'N/A';
  const stack = error?.stack || error?.message || 'Sin stack trace';

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 Error 5XX', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Timestamp:*\n${timestamp}` },
          { type: 'mrkdwn', text: `*Ruta:*\n${method} ${url}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Mensaje:*\n\`${error.message || error}\`` }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Stack:*\n\`\`\`${stack}\`\`\`` }
      }
    ]
  };

  try {
    await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Error enviando a -> Slack:', err.message);
  }
};
export default { logErrorToSlack };
