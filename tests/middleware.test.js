import { jest } from '@jest/globals';
import { socketAuthMiddleware } from '../src/middleware/socket-auth.middleware.js';
import { errorHandler, notFound } from '../src/middleware/error-handler.js';
import { AppError } from '../src/utils/AppError.js';
import checkRol from '../src/middleware/role.middleware.js';
import { sanitize } from '../src/middleware/sanitize.js';

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
