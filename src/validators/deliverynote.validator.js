import { z } from 'zod';

const itemSchema = z.object({
  description: z.string()
    .min(1, 'LA DESCRIPCION ES REQUERIDA')
    .max(500, 'MAXIMO 500 CARACTERES')
    .trim(),
  quantity: z.number()
    .min(0, 'NO PUEDE SER NEGATIVA'),
  unit: z.enum(['hours', 'units', 'kg', 'm', 'km', 'liters', 'packages'], {
    message: 'UNIDAD NO VALIDA'
  }),
  price: z.number()
    .min(0, 'NO PUEDE SER NEGATIVO')
});

export const createDeliveryNoteSchema = z.object({
  body: z.object({
    project: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID DE PROYECTO NO VALIDO'),
    client: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID DE CLIENTE NO VALIDO'),
    type: z.enum(['hours', 'materials', 'mixed'])
      .optional(),
    date: z.string()
      .transform(val => new Date(val))
      .refine(val => !isNaN(val.getTime()), 'FECHA NO VALIDA')
      .optional(),
    items: z.array(itemSchema)
      .min(1, 'DEBE TENER AL MENOS UN ITEM'),
    taxRate: z.number()
      .min(0, 'NO PUEDE SER NEGATIVO')
      .max(100, 'MAXIMO 100%')
      .optional(),
    notes: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional()
  })
});

export const updateDeliveryNoteSchema = z.object({
  body: z.object({
    type: z.enum(['hours', 'materials', 'mixed'])
      .optional(),
    status: z.enum(['draft', 'sent', 'signed', 'cancelled'])
      .optional(),
    items: z.array(itemSchema)
      .min(1, 'DEBE TENER AL MENOS UN ITEM')
      .optional(),
    taxRate: z.number()
      .min(0, 'NO PUEDE SER NEGATIVO')
      .max(100, 'MAXIMO 100%')
      .optional(),
    notes: z.string()
      .max(1000, 'MAXIMO 1000 CARACTERES')
      .optional(),
    signedBy: z.string()
      .max(200, 'MAXIMO 200 CARACTERES')
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'DEBE ENVIAR AL MENOS UN CAMPO' }
  )
});

export const signDeliveryNoteSchema = z.object({
  body: z.object({
    signedBy: z.string()
      .min(1, 'NOMBRE DE QUIEN FIRMA ES REQUERIDO')
      .max(200, 'MAXIMO 200 CARACTERES'),
    signature: z.string().optional()
  })
});
