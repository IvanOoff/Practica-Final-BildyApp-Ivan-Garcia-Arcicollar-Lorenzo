import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { logErrorToSlack } from '../services/logger.service.js';

export const notFound = (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: true,
      message: 'Error de validacion',
      code: 'VALIDATION_ERROR',
      details
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: true,
      message: `Valor invalido para '${err.path}'`,
      code: 'CAST_ERROR'
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      error: true,
      message: `Ya existe un registro con ese '${field}'`,
      code: 'DUPLICATE_KEY'
    });
  }

  if (err.name === 'ZodError') {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      error: true,
      message: 'Error de validacion',
      code: 'VALIDATION_ERROR',
      details
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      message: 'Archivo muy grande',
      code: 'FILE_TOO_LARGE'
    });
  }

  logErrorToSlack(err, req).catch(() => {});

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: true,
    message: isProduction ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
    ...(!isProduction && { stack: err.stack })
  });
};
