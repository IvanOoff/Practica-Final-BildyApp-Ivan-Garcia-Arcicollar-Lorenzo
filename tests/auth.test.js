import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';

describe('AUTH - User Registration and Login', () => {
  const testUser = {
    name: 'Test User',
    lastName: 'Test',
    email: `test_${Date.now()}@test.com`,
    password: 'TestPass123'
  };

  let token = '';
  let refreshToken = '';

  describe('POST /api/user/register', () => {
    it('deberia registrar un nuevo usuario', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');

      token = res.body.accessToken;
      refreshToken = res.body.refreshToken;

      await User.findOneAndUpdate(
        { email: testUser.email },
        { status: 'verified' }
      );
    });

    it('deberia rechazar email duplicado', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect(409);

      expect(res.body.error).toBe(true);
    });

    it('deberia rechazar datos invalidos', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'invalid' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/login', () => {
    it('deberia hacer login correctamente', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      token = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('deberia rechazar password incorrecto', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });

    it('deberia rechazar usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'noexiste@test.com',
          password: 'TestPass123'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/user', () => {
    it('deberia obtener usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('deberia rechazar sin token', async () => {
      await request(app)
        .get('/api/user')
        .expect(401);
    });

    it('deberia rechazar token invalido', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);
    });
  });

  describe('POST /api/user/refresh', () => {
    it('deberia renovar access token', async () => {
      const res = await request(app)
        .post('/api/user/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });
  });

  afterAll(async () => {
    if (token) {
      await request(app)
        .delete('/api/user')
        .set('Authorization', `Bearer ${token}`);
    }
  });
});