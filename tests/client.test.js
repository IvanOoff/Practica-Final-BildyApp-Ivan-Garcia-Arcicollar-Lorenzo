import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('CLIENTS - Client Management', () => {
  const testUser = {
    name: 'Marc Garcia',
    lastName: 'Martinez',
    email: `client_test_${Date.now()}@bildyapp.es`,
    password: 'SecurePass99'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let companyId = '';

  const testClient = {
    name: 'Constructora Barcelona SL',
    email: 'info@constructora-bcn.es',
    phone: '932123456',
    contactPerson: 'Laura Fernandez',
    nif: '87654321B',
    address: {
      street: 'Avda. Diagonal',
      number: '452',
      postal: '08013',
      city: 'Barcelona',
      province: 'Barcelona'
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
      cif: '87654321B',
      isFreelance: true
    });
    companyId = company._id;

    await User.findByIdAndUpdate(userId, { company: companyId });
  });

  describe('POST /api/client', () => {
    it('should create a client', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(testClient)
        .expect(201);

      expect(res.body.data).toHaveProperty('name', testClient.name);
      expect(res.body.data).toHaveProperty('email', testClient.email);
      clientId = res.body.data._id;
    });

    it('should reject unauthenticated client creation', async () => {
      const res = await request(app)
        .post('/api/client')
        .send(testClient)
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/client', () => {
    it('should list clients', async () => {
      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/client/:id', () => {
    it('should get a client by ID', async () => {
      const res = await request(app)
        .get(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('_id', clientId);
    });

    it('should return 404 for non-existent client', async () => {
      await request(app)
        .get('/api/client/65f8b3a2c9d1e20012345678')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/client/:id', () => {
    it('should update a client', async () => {
      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Constructora Actualizada SA' })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'Constructora Actualizada SA');
    });
  });

  describe('DELETE /api/client/:id', () => {
    it('should delete a client (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('CLIENTE ELIMINADO');
    });

    it('should return 404 for already deleted client', async () => {
      await request(app)
        .get(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should permanently delete a client', async () => {
      const newClient = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testClient, email: `permanent_${Date.now()}@test.com`, nif: '77543210B' })
        .expect(201);

      const tempClientId = newClient.body.data._id;

      const delRes = await request(app)
        .delete(`/api/client/${tempClientId}?permanent=true`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(delRes.body.message).toBe('CLIENTE ELIMINADO');
    });
  });

  describe('GET /api/client/archived', () => {
    it('should list archived clients', async () => {
      const res = await request(app)
        .get('/api/client/archived')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list archived clients with pagination', async () => {
      const res = await request(app)
        .get('/api/client/archived?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.pagination).toHaveProperty('currentPage');
      expect(res.body.pagination).toHaveProperty('totalItems');
    });
  });

  describe('PATCH /api/client/:id/restore', () => {
    it('should restore a deleted client', async () => {
      const res2 = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testClient, email: `restore_${Date.now()}@test.com`, nif: '99876543B' })
        .expect(201);

      const tempClientId = res2.body.data._id;

      await request(app)
        .delete(`/api/client/${tempClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const restoreRes = await request(app)
        .patch(`/api/client/${tempClientId}/restore`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(restoreRes.body.message).toBe('CLIENTE RESTAURADO');
    });

    it('should return 404 for non-existent client restore', async () => {
      await request(app)
        .patch('/api/client/65f8b3a2c9d1e20012345678/restore')
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