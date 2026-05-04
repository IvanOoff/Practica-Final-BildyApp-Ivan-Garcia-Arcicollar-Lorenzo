import { z } from 'zod';
export const createClientSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim(),
    email: z.string()
      .email('EMAIL NO VALIDO')
      .toLowerCase()
      .trim(),
    phone: z.string()
      .max(20, 'MAXIMO 20 CARACTERES')
      .optional(),
    contactPerson: z.string()
      .max(100, 'MAXIMO 100 CARACTERES')
      .optional(),
    nif: z.string()
      .regex(/^[0-9]{8}[A-Z]$/, 'NIF NO VALIDO')
      .optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      number: z.string().max(20).optional(),
      postal: z.string().max(10).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional()
    }).optional()
  })
});
export const updateClientSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'MINIMO 2 CARACTERES')
      .max(200, 'MAXIMO 200 CARACTERES')
      .trim()
      .optional(),
    email: z.string()
      .email('EMAIL NO VALIDO')
      .toLowerCase()
      .trim()
      .optional(),
    phone: z.string()
      .max(20, 'MAXIMO 20 CARACTERES')
      .optional(),
    contactPerson: z.string()
      .max(100, 'MAXIMO 100 CARACTERES')
      .optional(),
    nif: z.string()
      .regex(/^[0-9]{8}[A-Z]$/, 'NIF NO VALIDO')
      .optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      number: z.string().max(20).optional(),
      postal: z.string().max(10).optional(),
      city: z.string().max(100).optional(),
      province: z.string().max(100).optional()
    }).optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'DEBE ENVIAR AL MENOS UN CAMPO' }
  )
});