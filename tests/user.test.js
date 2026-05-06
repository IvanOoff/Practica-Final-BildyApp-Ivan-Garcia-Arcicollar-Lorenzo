import request from 'supertest';
import app from '../src/app.js';
import '../tests/setup.js';
import User from '../src/models/User.js';

describe('USER - Profile Management', () => {
  const testUser = {
    name: 'Carlos Martinez',
    lastName: 'García',
    email: `user_profile_${Date.now()}@bildyapp.es`,
    password: 'SecurePass99'
  };

  let token = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send(testUser);
    token = res.body.accessToken;

    await User.findOneAndUpdate(
      { email: testUser.email },
      { status: 'verified' }
    );
  });

  describe('GET /api/user', () => {
    it('should get user profile', async () => {
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
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('PUT /api/user/register', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/user/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Carlos Updated'
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('name', 'Carlos Updated');
    });

    it('should reject empty update', async () => {
      const res = await request(app)
        .put('/api/user/register')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('PUT /api/user/password', () => {
    it('should change password', async () => {
      const res = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SecurePass99',
          newPassword: 'NewSecurePass99'
        })
        .expect(200);

      expect(res.body.message).toBe('Contrasena cambiada correctamente');
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPass99'
        })
        .expect(401);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/user/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(res.body.message).toBe('Sesion cerrada correctamente');
    });
  });

  describe('DELETE /api/user', () => {
    it('should soft delete user', async () => {
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'NewSecurePass99'
        });

      const deleteToken = loginRes.body.accessToken;

      const res = await request(app)
        .delete('/api/user')
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(200);

      expect(res.body.message).toBe('Usuario eliminado');
    });
  });

  afterAll(async () => {
  });
});