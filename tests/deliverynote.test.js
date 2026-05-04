import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('DELIVERY NOTES - Delivery Note Management', () => {
  const testUser = {
    name: 'Test User',
    lastName: 'Test',
    email: `delivery_test_${Date.now()}@test.com`,
    password: 'TestPass123'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let projectId = '';
  let deliveryNoteId = '';
  let companyId = '';

  const testClient = {
    name: 'Cliente Albaran',
    email: 'albaran@test.com'
  };

  const testProject = {
    name: 'Proyecto Albaran',
    description: 'Descripcion proyecto albaran'
  };

  const testDeliveryNote = {
    client: '',
    type: 'hours',
    items: [
      {
        description: 'Horas de desarrollo',
        quantity: 10,
        unit: 'hours',
        price: 50
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
      cif: '12345678A',
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
    it('deberia crear un albaran', async () => {
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

    it('deberia calcular totales automaticamente', async () => {
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
    it('deberia listar albaranes', async () => {
      const res = await request(app)
        .get('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deberia filtrar por proyecto', async () => {
      const res = await request(app)
        .get(`/api/deliverynote?project=${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/deliverynote/:id/send', () => {
    it('deberia enviar un albaran', async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/send`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'sent');
    });
  });

  describe('PATCH /api/deliverynote/:id/sign', () => {
    it('deberia firmar un albaran', async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ signedBy: 'Juan Firmante' })
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'signed');
      expect(res.body.data).toHaveProperty('signedBy', 'Juan Firmante');
    });
  });

  describe('DELETE /api/deliverynote/:id', () => {
    it('deberia eliminar un albaran (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('ALBARAN ELIMINADO');
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