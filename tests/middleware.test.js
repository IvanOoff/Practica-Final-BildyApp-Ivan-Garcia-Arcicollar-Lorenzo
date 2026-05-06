import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { socketAuthMiddleware } from '../src/middleware/socket-auth.middleware.js';
import { errorHandler, notFound } from '../src/middleware/error-handler.js';
import { AppError } from '../src/utils/AppError.js';
import checkRol from '../src/middleware/role.middleware.js';
import { sanitize } from '../src/middleware/sanitize.js';
import { validate, validateObjectId } from '../src/middleware/validate.js';
import { verifyAccessToken } from '../src/utils/handleJwt.js';

describe('SOCKET AUTH MIDDLEWARE', () => {
  let mockSocket;
  let mockNext;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  it('should reject if no token', () => {
    mockSocket = { handshake: { auth: {} } };

    socketAuthMiddleware(mockSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toBe('Token no proporcionado');
  });

  it('should reject invalid token', () => {
    mockSocket = { handshake: { auth: { token: 'invalid-token' } } };

    socketAuthMiddleware(mockSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toBe('Token inválido');
  });
});

describe('ROLE MIDDLEWARE', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { user: null };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call next with unauthorized if no user', () => {
    const middleware = checkRol(['admin']);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should call next with forbidden if role not allowed', () => {
    mockReq.user = { role: 'user' };
    const middleware = checkRol(['admin']);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  it('should call next without error if role is allowed', () => {
    mockReq.user = { role: 'admin' };
    const middleware = checkRol(['admin', 'superadmin']);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });
});

describe('SANITIZE MIDDLEWARE', () => {
  it('should be defined', () => {
    expect(sanitize).toBeDefined();
  });
});

describe('ERROR HANDLER', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle operational errors', () => {
    const error = AppError.badRequest('Test error', 'TEST_CODE');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: 'Test error',
      code: 'TEST_CODE'
    }));
  });

  it('should handle not found errors', () => {
    const error = AppError.notFound('User');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'User no encontrado'
    }));
  });

  it('should handle duplicate key errors', () => {
    const error = { code: 11000, keyValue: { email: 'test@test.com' } };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'DUPLICATE_KEY',
      message: expect.stringContaining('email')
    }));
  });

  it('should handle ZodError', () => {
    const error = { name: 'ZodError', errors: [{ path: ['name'], message: 'Name required' }] };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'VALIDATION_ERROR'
    }));
  });

  it('should handle file too large errors', () => {
    const error = { code: 'LIMIT_FILE_SIZE' };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'FILE_TOO_LARGE'
    }));
  });
});

describe('NOT FOUND HANDLER', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/unknown' };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call next with not found error', () => {
    notFound(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('/unknown');
  });
});

describe('MONGOOSE VALIDATION ERROR', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle mongoose ValidationError', () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.errors = {
      name: { path: 'name', message: 'Name is required' },
      email: { path: 'email', message: 'Email is invalid' }
    };

    errorHandler(validationError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: 'Error de validacion',
      code: 'VALIDATION_ERROR'
    }));
  });

  it('should handle mongoose CastError', () => {
    const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'someField');

    errorHandler(castError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'CAST_ERROR',
      message: expect.stringContaining('someField')
    }));
  });
});

describe('VALIDATE MIDDLEWARE', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should call next for valid schema', () => {
    const mockSchema = {
      parse: jest.fn().mockReturnValue({})
    };

    validate(mockSchema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle ZodError in validate', () => {
    const zodError = new ZodError([{
      path: ['body', 'name'],
      message: 'Name required',
      code: 'invalid_type'
    }]);

    const mockSchema = {
      parse: jest.fn().mockImplementation(() => { throw zodError; })
    };

    validate(mockSchema)(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'VALIDATION_ERROR'
    }));
  });

  it('should call next for non-ZodError', () => {
    const genericError = new Error('Some error');
    const mockSchema = {
      parse: jest.fn().mockImplementation(() => { throw genericError; })
    };

    validate(mockSchema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(genericError);
  });
});

describe('VALIDATE OBJECT ID', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should call next for valid ObjectId', () => {
    mockReq.params.id = new mongoose.Types.ObjectId().toString();

    validateObjectId('id')(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for invalid ObjectId', () => {
    mockReq.params.id = 'invalid-id';

    validateObjectId('id')(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'INVALID_ID'
    }));
  });
});

describe('APP ERROR STATIC METHODS', () => {
  it('should create badRequest error', () => {
    const error = AppError.badRequest('Bad request test', 'BAD_TEST');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request test');
    expect(error.code).toBe('BAD_TEST');
  });

  it('should create unauthorized error', () => {
    const error = AppError.unauthorized('Unauthorized test', 'AUTH_TEST');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized test');
  });

  it('should create forbidden error', () => {
    const error = AppError.forbidden('Forbidden test', 'FORBIDDEN_TEST');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden test');
  });

  it('should create notFound error', () => {
    const error = AppError.notFound('User', 'USER_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('User no encontrado');
  });

  it('should create conflict error', () => {
    const error = AppError.conflict('Conflict test', 'CONFLICT_TEST');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Conflict test');
  });

  it('should create validation error with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const error = AppError.validation('Validation failed', details);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('should create tooManyRequests error', () => {
    const error = AppError.tooManyRequests('Rate limit exceeded', 'RATE_TEST');
    expect(error.statusCode).toBe(429);
    expect(error.message).toBe('Rate limit exceeded');
  });

  it('should create internal error', () => {
    const error = AppError.internal('Internal error test', 'INT_TEST');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal error test');
  });

  it('should create AppError with default values', () => {
    const error = new AppError('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });
});

describe('ERROR HANDLER - PRODUCTION MODE', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should hide stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Secret error');
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: 'Error interno del servidor'
    }));

    process.env.NODE_ENV = originalEnv;
  });

  it('should show stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Dev error');
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      stack: expect.any(String)
    }));

    process.env.NODE_ENV = originalEnv;
  });
});

describe('HANDLE JWT - verifyAccessToken', () => {
  it('should return null for invalid token', () => {
    const result = verifyAccessToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for malformed token', () => {
    const result = verifyAccessToken('not.a.valid.jwt.token');
    expect(result).toBeNull();
  });

  it('should return null for empty token', () => {
    const result = verifyAccessToken('');
    expect(result).toBeNull();
  });
});

describe('APP ERROR - Error handling scenarios', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle error with details property', () => {
    const error = AppError.badRequest('Validation failed', 'VALIDATION');
    error.details = [{ field: 'email', message: 'Invalid email' }];

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.any(Array)
    }));
  });

  it('should handle CastError for invalid ObjectId', () => {
    const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'someField');

    errorHandler(castError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('someField')
    }));
  });

  it('should handle unknown error type', () => {
    const error = new Error('Unknown error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});

describe('ERROR HANDLER - Edge Cases', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle error with no message', () => {
    const error = {};

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalled();
  });

  it('should handle non-AppError with code 11000', () => {
    const error = { code: 11000, keyValue: { name: 'test' } };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
  });
});

describe('VALIDATE MIDDLEWARE - Edge Cases', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: { name: 'test' }, query: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle schema.parse throwing non-Zod error', () => {
    const error = new Error('Database error');
    const mockSchema = {
      parse: jest.fn().mockImplementation(() => { throw error; })
    };

    validate(mockSchema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});