import mongoose from 'mongoose';
import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues?.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })) || [];

      return res.status(400).json({
        error: true,
        message: 'Error de validación',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    next(error);
  }
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: `'${paramName}' no es un ID válido..`,
      code: 'INVALID_ID'
    });
  }

  next();
};
