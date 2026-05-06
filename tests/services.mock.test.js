import { describe, it, expect } from '@jest/globals';

describe('LOGGER SERVICE', () => {
  it('should have logErrorToSlack function', async () => {
    const { logErrorToSlack } = await import('../src/services/logger.service.js');
    expect(typeof logErrorToSlack).toBe('function');
  });
});

describe('MAIL SERVICE', () => {
  it('should have sendVerificationEmail function', async () => {
    const { sendVerificationEmail } = await import('../src/services/mail.service.js');
    expect(typeof sendVerificationEmail).toBe('function');
  });

  it('should have sendDeliveryNoteSigned function', async () => {
    const { sendDeliveryNoteSigned } = await import('../src/services/mail.service.js');
    expect(typeof sendDeliveryNoteSigned).toBe('function');
  });
});

describe('STORAGE SERVICE', () => {
  it('should have uploadImage function', async () => {
    const { uploadImage } = await import('../src/services/storage.service.js');
    expect(typeof uploadImage).toBe('function');
  });

  it('should have uploadPdf function', async () => {
    const { uploadPdf } = await import('../src/services/storage.service.js');
    expect(typeof uploadPdf).toBe('function');
  });

  it('should have deleteFile function', async () => {
    const { deleteFile } = await import('../src/services/storage.service.js');
    expect(typeof deleteFile).toBe('function');
  });
});