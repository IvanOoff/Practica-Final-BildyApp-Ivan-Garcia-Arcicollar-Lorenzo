import { jest } from '@jest/globals';
import { generateDeliveryNotePdf } from '../src/services/pdf.service.js';
import { emitToRoom, registerDeliveryNoteHandlers } from '../src/handlers/socket.handler.js';

describe('LOGGER SERVICE', () => {
  it('should be importable', async () => {
    const { logErrorToSlack } = await import('../src/services/logger.service.js');
    expect(logErrorToSlack).toBeDefined();
  });
});

describe('MAIL SERVICE', () => {
  it('should be importable', async () => {
    const { sendVerificationEmail, sendDeliveryNoteSigned } = await import('../src/services/mail.service.js');
    expect(sendVerificationEmail).toBeDefined();
    expect(sendDeliveryNoteSigned).toBeDefined();
  });
});

describe('PDF SERVICE', () => {
  it('should generate a PDF buffer for hours format', async () => {
    const deliveryNote = {
      sequentialNumber: 'ALB-2024-0001',
      workDate: new Date(),
      signed: false,
      client: {
        name: 'Test Client',
        cif: '12345678A',
        email: 'test@client.com'
      },
      project: {
        name: 'Test Project',
        projectCode: 'PRJ-001'
      },
      format: 'hours',
      description: 'Test description',
      hours: 10,
      workers: [{ name: 'Worker 1', hours: 5 }]
    };

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate a PDF buffer for material format', async () => {
    const deliveryNote = {
      sequentialNumber: 'ALB-2024-0002',
      workDate: new Date(),
      signed: true,
      signedAt: new Date(),
      signatureUrl: 'https://example.com/signature.png',
      client: { name: 'Client', cif: 'B12345678', email: 'c@client.com' },
      project: { name: 'Project', projectCode: 'P001' },
      format: 'material',
      material: 'Cemento',
      quantity: 100,
      unit: 'kg'
    };

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate PDF with minimal data', async () => {
    const deliveryNote = {
      sequentialNumber: 'ALB-2024-0003',
      workDate: new Date(),
      signed: false,
      client: {},
      project: {}
    };

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });
});

describe('SOCKET HANDLER', () => {
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      id: 'socket-123',
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn()
    };
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
  });

  it('should emit to room', () => {
    emitToRoom(mockIo, 'company:123', 'test:event', { data: 'test' });

    expect(mockIo.to).toHaveBeenCalledWith('company:123');
    expect(mockIo.emit).toHaveBeenCalledWith('test:event', { data: 'test' });
  });

  it('should register delivery note handlers', () => {
    registerDeliveryNoteHandlers(mockIo, mockSocket);

    expect(mockSocket.on).toHaveBeenCalledWith('company:join', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('company:leave', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('deliverynote:new', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('deliverynote:signed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('client:new', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('project:new', expect.any(Function));
  });

  it('should handle company:join event', () => {
    registerDeliveryNoteHandlers(mockIo, mockSocket);

    const joinHandler = mockSocket.on.mock.calls.find(call => call[0] === 'company:join')[1];
    joinHandler('company-456');

    expect(mockSocket.join).toHaveBeenCalledWith('company:company-456');
  });

  it('should handle company:leave event', () => {
    registerDeliveryNoteHandlers(mockIo, mockSocket);

    const leaveHandler = mockSocket.on.mock.calls.find(call => call[0] === 'company:leave')[1];
    leaveHandler('company-456');

    expect(mockSocket.leave).toHaveBeenCalledWith('company:company-456');
  });

  it('should handle deliverynote:new event', () => {
    registerDeliveryNoteHandlers(mockIo, mockSocket);

    const handler = mockSocket.on.mock.calls.find(call => call[0] === 'deliverynote:new')[1];
    const data = { companyId: 'comp-123', noteId: 'note-456' };

    handler(data);

    expect(mockIo.to).toHaveBeenCalledWith('company:comp-123');
    expect(mockIo.emit).toHaveBeenCalledWith('deliverynote:created', expect.objectContaining({
      ...data,
      timestamp: expect.any(String)
    }));
  });

  it('should handle deliverynote:signed event', () => {
    registerDeliveryNoteHandlers(mockIo, mockSocket);

    const handler = mockSocket.on.mock.calls.find(call => call[0] === 'deliverynote:signed')[1];
    const data = { companyId: 'comp-123', noteId: 'note-789' };

    handler(data);

    expect(mockIo.to).toHaveBeenCalledWith('company:comp-123');
    expect(mockIo.emit).toHaveBeenCalledWith('deliverynote:signed', expect.objectContaining({
      ...data,
      timestamp: expect.any(String)
    }));
  });
});
