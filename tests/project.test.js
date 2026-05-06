import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('PROJECTS - Project Management', () => {
  const testUser = {
    name: 'Pablo Ruiz',
    lastName: 'Sanchez',
    email: `project_test_${Date.now()}@bildyapp.es`,
    password: 'SecurePass99'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let projectId = '';
  let companyId = '';

  const testClient = {
    name: 'Inmobiliaria Valencia',
    email: 'contacto@inmovalencia.es'
  };

  const testProject = {
    name: 'Reforma Integral Oficina',
    projectCode: `PRJ-${Date.now()}`,
    description: 'Proyecto de reforma completa en local comercial'
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
  });

  describe('POST /api/project', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testProject, client: clientId })
        .expect(201);

      expect(res.body.data).toHaveProperty('name', testProject.name);
      expect(res.body.data).toHaveProperty('status', 'pending');
      projectId = res.body.data._id;
    });

    it('should reject project without client', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto Sin Cliente' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/project', () => {
    it('should list projects', async () => {
      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by client', async () => {
      const res = await request(app)
        .get(`/api/project?client=${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/project/:id', () => {
    it('should update a project', async () => {
      const res = await request(app)
        .put(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Reforma Oficina Actualizada' })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'Reforma Oficina Actualizada');
    });
  });

  describe('PATCH /api/project/:id/status', () => {
    it('should change project status', async () => {
      const res = await request(app)
        .patch(`/api/project/${projectId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'in_progress');
    });
  });

  describe('DELETE /api/project/:id', () => {
    it('should delete a project (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('PROYECTO ELIMINADO');
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