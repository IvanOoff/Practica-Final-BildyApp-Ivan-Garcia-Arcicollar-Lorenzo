import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('CLIENTS - Client Management', () => {
  const testUser = {
    name: 'Test User',
    lastName: 'Test',
    email: `client_test_${Date.now()}@test.com`,
    password: 'TestPass123'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let companyId = '';

  const testClient = {
    name: 'Cliente Test SL',
    email: 'cliente@test.com',
    phone: '612345678',
    contactPerson: 'Juan Perez',
    nif: '12345678A',
    address: {
      street: 'Calle Mayor',
      number: '1',
      postal: '28001',
      city: 'Madrid',
      province: 'Madrid'
    }
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
  });

  describe('POST /api/client', () => {
    it('deberia crear un cliente', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(testClient)
        .expect(201);

      expect(res.body.data).toHaveProperty('name', testClient.name);
      expect(res.body.data).toHaveProperty('email', testClient.email);
      clientId = res.body.data._id;
    });

    it('deberia rechazar cliente sin autenticar', async () => {
      const res = await request(app)
        .post('/api/client')
        .send(testClient)
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/client', () => {
    it('deberia listar clientes', async () => {
      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/client/:id', () => {
    it('deberia obtener un cliente por ID', async () => {
      const res = await request(app)
        .get(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('_id', clientId);
    });

    it('deberia devolver 404 para cliente inexistente', async () => {
      await request(app)
        .get('/api/client/65f8b3a2c9d1e20012345678')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/client/:id', () => {
    it('deberia actualizar un cliente', async () => {
      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Actualizado' })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'Cliente Actualizado');
    });
  });

  describe('DELETE /api/client/:id', () => {
    it('deberia eliminar un cliente (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('CLIENTE ELIMINADO');
    });

    it('deberia devolver 404 para cliente ya eliminado', async () => {
      await request(app)
        .get(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
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