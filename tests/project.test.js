import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

describe('PROJECTS - Project Management', () => {
  const testUser = {
    name: 'Test User',
    lastName: 'Test',
    email: `project_test_${Date.now()}@test.com`,
    password: 'TestPass123'
  };

  let token = '';
  let userId = '';
  let clientId = '';
  let projectId = '';
  let companyId = '';

  const testClient = {
    name: 'Cliente Proyecto',
    email: 'proyecto@test.com'
  };

  const testProject = {
    name: 'Proyecto Test',
    description: 'Descripcion del proyecto test'
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
  });

  describe('POST /api/project', () => {
    it('deberia crear un proyecto', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testProject, client: clientId })
        .expect(201);

      expect(res.body.data).toHaveProperty('name', testProject.name);
      expect(res.body.data).toHaveProperty('status', 'pending');
      projectId = res.body.data._id;
    });

    it('deberia rechazar proyecto sin cliente', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sin Cliente' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/project', () => {
    it('deberia listar proyectos', async () => {
      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deberia filtrar por cliente', async () => {
      const res = await request(app)
        .get(`/api/project?client=${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/project/:id', () => {
    it('deberia actualizar un proyecto', async () => {
      const res = await request(app)
        .put(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto Actualizado' })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'Proyecto Actualizado');
    });
  });

  describe('PATCH /api/project/:id/status', () => {
    it('deberia cambiar estado del proyecto', async () => {
      const res = await request(app)
        .patch(`/api/project/${projectId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.data).toHaveProperty('status', 'in_progress');
    });
  });

  describe('DELETE /api/project/:id', () => {
    it('deberia eliminar un proyecto (soft delete)', async () => {
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