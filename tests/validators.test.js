import {
  validatorRegister,
  validatorLogin,
  validatorValidate,
  validatorUpdateProfile,
  validatorChangePassword,
  validatorRefresh,
  validatorCreateCompany
} from '../src/validators/user.validator.js';

import {
  createProjectSchema,
  updateProjectSchema,
  changeStatusSchema
} from '../src/validators/project.validator.js';

import {
  createDeliveryNoteSchema,
  updateDeliveryNoteSchema,
  signDeliveryNoteSchema
} from '../src/validators/deliverynote.validator.js';

describe('USER VALIDATORS', () => {
  describe('validatorRegister', () => {
    it('should validate valid registration data', () => {
      const data = {
        body: {
          email: 'test@test.com',
          password: 'TestPass123',
          name: 'John',
          lastName: 'Doe'
        }
      };
      const result = validatorRegister.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        body: {
          email: 'invalid-email',
          password: 'TestPass123'
        }
      };
      const result = validatorRegister.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const data = {
        body: {
          email: 'test@test.com',
          password: 'short'
        }
      };
      const result = validatorRegister.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow optional name and lastName', () => {
      const data = {
        body: {
          email: 'test@test.com',
          password: 'TestPass123'
        }
      };
      const result = validatorRegister.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validatorLogin', () => {
    it('should validate valid login data', () => {
      const data = {
        body: {
          email: 'test@test.com',
          password: 'TestPass123'
        }
      };
      const result = validatorLogin.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const data = {
        body: {
          email: 'test@test.com'
        }
      };
      const result = validatorLogin.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validatorValidate', () => {
    it('should validate 6-digit code', () => {
      const data = { body: { code: '123456' } };
      const result = validatorValidate.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric code', () => {
      const data = { body: { code: '12345a' } };
      const result = validatorValidate.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject wrong length code', () => {
      const data = { body: { code: '12345' } };
      const result = validatorValidate.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validatorUpdateProfile', () => {
    it('should validate with valid name', () => {
      const data = { body: { name: 'Jane' } };
      const result = validatorUpdateProfile.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty body', () => {
      const data = { body: {} };
      const result = validatorUpdateProfile.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with valid NIF', () => {
      const data = { body: { nif: '12345678A' } };
      const result = validatorUpdateProfile.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validatorChangePassword', () => {
    it('should validate different passwords', () => {
      const data = {
        body: {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass123'
        }
      };
      const result = validatorChangePassword.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject same passwords', () => {
      const data = {
        body: {
          currentPassword: 'SamePass123',
          newPassword: 'SamePass123'
        }
      };
      const result = validatorChangePassword.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject weak new password', () => {
      const data = {
        body: {
          currentPassword: 'OldPass123',
          newPassword: 'weak'
        }
      };
      const result = validatorChangePassword.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validatorCreateCompany', () => {
    it('should validate non-freelance company', () => {
      const data = {
        body: {
          isFreelance: false,
          name: 'Test Company',
          cif: '12345678A'
        }
      };
      const result = validatorCreateCompany.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate freelance company', () => {
      const data = {
        body: {
          isFreelance: true
        }
      };
      const result = validatorCreateCompany.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CIF', () => {
      const data = {
        body: {
          isFreelance: false,
          name: 'Test Company',
          cif: 'invalid'
        }
      };
      const result = validatorCreateCompany.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('PROJECT VALIDATORS', () => {
  describe('createProjectSchema', () => {
    it('should validate with required fields', () => {
      const data = {
        body: {
          client: '507f1f77bcf86cd799439011',
          name: 'Test Project'
        }
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing client', () => {
      const data = {
        body: {
          name: 'Test Project'
        }
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid client ID', () => {
      const data = {
        body: {
          client: 'invalid-id',
          name: 'Test Project'
        }
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with optional fields', () => {
      const data = {
        body: {
          client: '507f1f77bcf86cd799439011',
          name: 'Test Project',
          description: 'A description',
          status: 'in_progress',
          startDate: '2024-01-01'
        }
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate empty update as invalid', () => {
      const data = { body: {} };
      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate partial update', () => {
      const data = { body: { status: 'completed' } };
      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('changeStatusSchema', () => {
    it('should validate valid status', () => {
      const data = { body: { status: 'in_progress' } };
      const result = changeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const data = { body: { status: 'invalid' } };
      const result = changeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('DELIVERY NOTE VALIDATORS', () => {
  describe('createDeliveryNoteSchema', () => {
    it('should validate with required fields', () => {
      const data = {
        body: {
          project: '507f1f77bcf86cd799439011',
          client: '507f1f77bcf86cd799439012',
          items: [{
            description: 'Test item',
            quantity: 10,
            unit: 'hours',
            price: 50
          }]
        }
      };
      const result = createDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing items', () => {
      const data = {
        body: {
          project: '507f1f77bcf86cd799439011',
          client: '507f1f77bcf86cd799439012'
        }
      };
      const result = createDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
      const data = {
        body: {
          project: '507f1f77bcf86cd799439011',
          client: '507f1f77bcf86cd799439012',
          items: []
        }
      };
      const result = createDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateDeliveryNoteSchema', () => {
    it('should validate partial update', () => {
      const data = {
        body: {
          notes: 'Updated notes'
        }
      };
      const result = updateDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty body', () => {
      const data = { body: {} };
      const result = updateDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('signDeliveryNoteSchema', () => {
    it('should validate with signedBy', () => {
      const data = { body: { signedBy: 'John Doe' } };
      const result = signDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with signature', () => {
      const data = {
        body: {
          signedBy: 'John Doe',
          signature: 'data:image/png;base64,abc123'
        }
      };
      const result = signDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing signedBy', () => {
      const data = { body: {} };
      const result = signDeliveryNoteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
