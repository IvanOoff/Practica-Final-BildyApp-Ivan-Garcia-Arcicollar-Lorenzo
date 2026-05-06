import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';

describe('AUTH - User Registration and Login', () => {
  const testUser = {
    name: 'David Sanchez',
    lastName: 'Lopez',
    email: `test_${Date.now()}@bildyapp.es`,
    password: 'TestPass123'
  };

  let token = '';
  let refreshToken = '';

  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
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

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect(409);

      expect(res.body.error).toBe(true);
    });

    it('should reject invalid data', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'invalid' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/login', () => {
    it('should login correctly', async () => {
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

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'noexiste@bildyapp.es',
          password: 'TestPass123'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/user', () => {
    it('should get authenticated user', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should reject without token', async () => {
      await request(app)
        .get('/api/user')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);
    });

    it('should reject malformed authorization header', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('should reject expired token format', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIifQ.test')
        .expect(401);
    });
  });

  describe('POST /api/user/login - edge cases', () => {
    it('should reject empty email', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: '',
          password: 'TestPass123'
        })
        .expect(400);

      expect(res.body.error).toBe(true);
    });

    it('should reject empty password', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: ''
        })
        .expect(400);

      expect(res.body.error).toBe(true);
    });

    it('should reject missing password field', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(res.body.error).toBe(true);
    });

    it('should reject missing email field', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          password: 'TestPass123'
        })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/refresh', () => {
    it('should renew access token', async () => {
      const res = await request(app)
        .post('/api/user/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/user/refresh')
        .send({
          refreshToken: 'invalid_token'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/user/refresh')
        .send({})
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/user/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body.message).toBe('Sesion cerrada correctamente');
    });
  });

  describe('PUT /api/user/password', () => {
    it('should change password', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const newToken = loginRes.body.accessToken;

      const res = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPass123'
        })
        .expect(200);

      expect(res.body.message).toBe('Contrasena cambiada correctamente');
    });

    it('should reject wrong current password', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'NewPass123'
        });

      const newToken = loginRes.body.accessToken;

      const res = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPass123'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('PUT /api/user/register (profile update)', () => {
    it('should update profile', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'NewPass123'
        });

      const newToken = loginRes.body.accessToken;

      const res = await request(app)
        .put('/api/user/register')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          name: 'David Updated'
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'David Updated');
    });

    it('should reject empty update', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'NewPass123'
        });

      const newToken = loginRes.body.accessToken;

      const res = await request(app)
        .put('/api/user/register')
        .set('Authorization', `Bearer ${newToken}`)
        .send({})
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('DELETE /api/user', () => {
    it('should soft delete user', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'NewPass123'
        });

      const newToken = loginRes.body.accessToken;

      const res = await request(app)
        .delete('/api/user')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(res.body.message).toBe('Usuario eliminado');
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