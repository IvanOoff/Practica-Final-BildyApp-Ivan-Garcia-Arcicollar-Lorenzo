// Para li9mitar las request que entren del usuario.
import rateLimit from 'express-rate-limit';

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Demasiadas peticiones', code: 'RATE_LIMIT' }
});

export default rateLimitMiddleware;