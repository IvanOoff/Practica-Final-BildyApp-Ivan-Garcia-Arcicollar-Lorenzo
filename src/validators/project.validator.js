import { z } from 'zod';
export const createProjectSchema = z.object({
  body: z.object({
    client: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID DE CLIENTE NO VALIDO'),
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim(),
    description: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
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
  )
});
export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim()
      .optional(),
    description: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
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