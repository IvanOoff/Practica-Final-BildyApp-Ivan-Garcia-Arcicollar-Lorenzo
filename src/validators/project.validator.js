import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    client: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID DE CLIENTE NO VALIDO'),
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim(),
    projectCode: z.string()
      .min(1, 'EL CODIGO ES REQUERIDO')
      .max(50, 'MAXIMO 50 CARACTERES')
      .trim()
      .toUpperCase(),
    description: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      number: z.string().max(20).optional(),
      postal: z.string().max(10).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional()
    }).optional(),
    email: z.string()
      .email('EMAIL NO VALIDO')
      .optional(),
    notes: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional(),
    active: z.boolean()
      .optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
      .optional(),
    startDate: z.string()
      .transform(val => new Date(val))
      .refine(val => !isNaN(val.getTime()), 'FECHA NO VALIDA')
      .optional(),
    endDate: z.string()
      .transform(val => new Date(val))
      .refine(val => !isNaN(val.getTime()), 'FECHA NO VALIDA')
      .optional()
  }).refine(
    (data) => data.name && data.name.length >= 2,
    { message: 'EL NOMBRE ES REQUERIDO', path: ['name'] }
  ).refine(
    (data) => data.projectCode,
    { message: 'EL CODIGO DE PROYECTO ES REQUERIDO', path: ['projectCode'] }
  )
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim()
      .optional(),
    projectCode: z.string()
      .min(1, 'MINIMO 1 CARACTER')
      .max(50, 'MAXIMO 50 CARACTERES')
      .trim()
      .toUpperCase()
      .optional(),
    description: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      number: z.string().max(20).optional(),
      postal: z.string().max(10).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional()
    }).optional(),
    email: z.string()
      .email('EMAIL NO VALIDO')
      .optional(),
    notes: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional(),
    active: z.boolean()
      .optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
      .optional(),
    startDate: z.string()
      .transform(val => new Date(val))
      .refine(val => !isNaN(val.getTime()), 'FECHA NO VALIDA')
      .optional(),
    endDate: z.string()
      .transform(val => new Date(val))
      .refine(val => !isNaN(val.getTime()), 'FECHA NO VALIDA')
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'DEBE ENVIAR AL MENOS UN CAMPO' }
  )
});

export const changeStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'], {
      message: 'ESTADO NO VALIDO'
    })
  })
});