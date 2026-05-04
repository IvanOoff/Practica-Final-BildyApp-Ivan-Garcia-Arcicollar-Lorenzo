import mongoSanitize from 'express-mongo-sanitize';

export const sanitize = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    const originalQuery = { ...req.query };
    mongoSanitize.middleware(req, res, () => {
      req.query = originalQuery;
      next();
    });
  } else {
    next();
  }
};