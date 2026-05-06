import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('DELIVERY NOTES - Delivery Note Management', () => {
  const testUser = {
    name: 'Ana Lopez',
    lastName: 'Gil',
    email: `delivery_test_${Date.now()}@bildyapp.es`,
    password: 'SecurePass99'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let projectId = '';
  let deliveryNoteId = '';
  let companyId = '';

  const testClient = {
    name: 'Servicios Informaticos Sevilla',
    email: 'admin@servicessevilla.es'
  };

  const testProject = {
    name: 'Desarrollo App Mobile',
    projectCode: `PRJ-DELIVERY-${Date.now()}`,
    description: 'Desarrollo de aplicacion movil para Gestion'
  };

  const testDeliveryNote = {
    client: '',
    format: 'hours',
    items: [
      {
        description: 'Desarrollo backend API REST',
        quantity: 40,
        unit: 'hours',
        price: 55
      }
    ],
    taxRate: 21
  };

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send(testUser);
    token = res.body.accessToken;

    const user = await User.findOne({ email: testUser.email });
    userId = user._id;

    await User.findOneAndUpdate(
      { email: testUser.email },
      { status: 'verified' }
    );

    const company = await Company.create({
      owner: userId,
      name: `${testUser.name} ${testUser.lastName}`,
      cif: '87654321B',
      isFreelance: true
    });
    companyId = company._id;

    await User.findByIdAndUpdate(userId, { company: companyId });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(testClient);
    clientId = clientRes.body.data._id;

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...testProject, client: clientId });
    projectId = projectRes.body.data._id;

    testDeliveryNote.client = clientId;
  });

  describe('POST /api/deliverynote', () => {
    it('should create a delivery note', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: projectId })
        .expect(201);

      expect(res.body.data).toHaveProperty('sequentialNumber');
      expect(res.body.data).toHaveProperty('status', 'draft');
      expect(res.body.data.items.length).toBe(1);
      deliveryNoteId = res.body.data._id;
    });

    it('should calculate totals automatically', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: projectId });

      expect(res.body.data).toHaveProperty('subtotal');
      expect(res.body.data).toHaveProperty('taxAmount');
      expect(res.body.data).toHaveProperty('totalAmount');
    });
  });

  describe('GET /api/deliverynote', () => {
    it('should list delivery notes', async () => {
      const res = await request(app)
        .get('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by project', async () => {
      const res = await request(app)
        .get(`/api/deliverynote?project=${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/deliverynote/:id/send', () => {
    it('should send a delivery note', async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/send`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'sent');
    });
  });

  describe('PATCH /api/deliverynote/:id/sign', () => {
    it('should sign a delivery note', async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ signedBy: 'Carlos Rodriguez' })
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'signed');
      expect(res.body.data).toHaveProperty('signedBy', 'Carlos Rodriguez');
    });
  });

  describe('DELETE /api/deliverynote/:id', () => {
    it('should delete a delivery note (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('ALBARAN ELIMINADO');
    });

    it('should return 404 for non-existent delivery note delete', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .delete(`/api/deliverynote/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /api/deliverynote/:id/pdf', () => {
    it('should return PDF for delivery note', async () => {
      const newDN = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: projectId })
        .expect(201);

      const newId = newDN.body.data._id;

      const res = await request(app)
        .get(`/api/deliverynote/${newId}/pdf`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should return 404 for non-existent delivery note PDF', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/deliverynote/${fakeId}/pdf`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/deliverynote - validation', () => {
    it('should reject with empty items', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: projectId, items: [] })
        .expect(400);

      expect(res.body.error).toBe(true);
    });

    it('should reject invalid project ID format', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: 'invalid-id' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });

    it('should reject invalid workDate format', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testDeliveryNote, project: projectId, workDate: 'not-a-date' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  afterAll(async () => {
    if (userId) {
      await request(app)
        .delete('/api/user')
        .set('Authorization', `Bearer ${token}`);
    }
  });
});