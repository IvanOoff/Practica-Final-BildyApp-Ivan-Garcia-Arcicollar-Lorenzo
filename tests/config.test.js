import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('DATABASE CONFIG', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should export dbConnect function', async () => {
    const { dbConnect } = await import('../src/config/database.js');
    expect(typeof dbConnect).toBe('function');
  });

  it('should export mongoose', async () => {
    const { mongoose } = await import('../src/config/database.js');
    expect(mongoose).toBeDefined();
  });
});

describe('SOCKET CONFIG', () => {
  let mockHttpServer;
  let mockServer;

  beforeEach(() => {
    jest.resetModules();
    mockServer = {
      on: jest.fn(),
      emit: jest.fn()
    };
    mockHttpServer = {};
  });

  it('should export configureSocket function', async () => {
    const { configureSocket } = await import('../src/config/socket.js');
    expect(typeof configureSocket).toBe('function');
  });

  it('should export getIO function', async () => {
    const { getIO } = await import('../src/config/socket.js');
    expect(typeof getIO).toBe('function');
  });

  it('should throw error if getIO called before configureSocket', async () => {
    const { getIO } = await import('../src/config/socket.js');
    expect(() => getIO()).toThrow('Socket.IO no ha sido inicializado');
  });
});

describe('CONFIG INDEX', () => {
  it('should export config', async () => {
    const config = (await import('../src/config/index.js')).default;
    expect(config).toBeDefined();
    expect(typeof config.port).toBe('string');
  });
});