import { z } from 'zod';

const generateValidationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validatorRegister = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .toLowerCase()
      .email('Email no válido'),
    password: z.string()
      .min(8, 'Mínimo 8 caracteres'),
    name: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim(),
    lastName: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim()
  })
});

export const validatorLogin = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .toLowerCase()
      .email('Email no válido'),
    password: z.string()
      .min(8, 'Mínimo 8 caracteres')
  })
});

export const validatorValidate = z.object({
  body: z.object({
    code: z.string()
      .length(6, 'El código debe tener 6 dígitos')
      .regex(/^[0-9]+$/, 'El código solo debe contener números')
  })
});

export const validatorUpdateProfile = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim()
      .optional(),
    lastName: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim()
      .optional(),
    NIF: z.string()
      .regex(/^[0-9]{8}[A-Z]$/, 'NIF no válido')
      .optional()
  }).refine(
    data => Object.keys(data).length > 0,
    { message: 'Debe enviar al menos un campo' }
  )
});

export const validatorChangePassword = z.object({
  body: z.object({
    currentPassword: z.string()
      .min(8, 'Mínimo 8 caracteres'),
    newPassword: z.string()
      .min(8, 'Mínimo 8 caracteres')
      .max(16, 'Máximo 16 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
  }).refine(
    data => data.currentPassword !== data.newPassword,
    { message: 'La nueva contraseña debe ser diferente', path: ['newPassword'] }
  )
});

export const validatorRefresh = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido')
  })
});

export const validatorCreateCompany = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({
      isFreelance: z.literal(false),
      name: z.string()
        .min(2, 'Mínimo 2 caracteres')
        .max(200, 'Máximo 200 caracteres')
        .trim(),
      cif: z.string()
        .regex(/^[0-9]{8}[A-Z]$/, 'CIF no válido'),
      address: z.object({
        street: z.string().trim().max(200).optional(),
        number: z.string().trim().max(20).optional(),
        postal: z.string().trim().max(10).optional(),
        city: z.string().trim().max(100).optional(),
        province: z.string().trim().max(100).optional()
      }).optional()
    }),
    z.object({
      isFreelance: z.literal(true)
    })
  ])
});

export const validatorUpdateCompany = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(200, 'Máximo 200 caracteres')
      .trim()
      .optional(),
    address: z.string()
      .max(300, 'Máximo 300 caracteres')
      .trim()
      .optional()
  }).refine(
    data => Object.keys(data).length > 0,
    { message: 'Debe enviar al menos un campo' }
  )
});

export const validatorInviteUser = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .toLowerCase()
      .email('Email no válido'),
    password: z.string()
      .min(8, 'Mínimo 8 caracteres'),
    name: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim()
      .optional(),
    lastName: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim()
      .optional()
  })
});