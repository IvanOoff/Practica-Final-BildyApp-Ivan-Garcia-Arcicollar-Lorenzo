import { Router } from 'express';
import {
  createDeliveryNoteCtrl,
  getDeliveryNotesCtrl,
  getDeliveryNoteCtrl,
  updateDeliveryNoteCtrl,
  signDeliveryNoteCtrl,
  sendDeliveryNoteCtrl,
  deleteDeliveryNoteCtrl,
  getDeliveryNotePDFCtrl
} from '../controllers/deliverynote.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { createDeliveryNoteSchema, updateDeliveryNoteSchema, signDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags: [DeliveryNotes]
 *     summary: Crear albarán
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, client, format, workDate]
 *             properties:
 *               project: { type: string }
 *               client: { type: string }
 *               format: { type: string, enum: [material, hours] }
 *               description: { type: string }
 *               workDate: { type: string, format: date }
 *               material: { type: string }
 *               quantity: { type: number }
 *               unit: { type: string }
 *               hours: { type: number }
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     hours: { type: number }
 *     responses:
 *       201: { description: Albarán creado }
 *       400: { description: Error de validación }
 */
router.post('/', authMiddleware, validate(createDeliveryNoteSchema), createDeliveryNoteCtrl);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Listar albaranes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de albaranes }
 */
router.get('/', authMiddleware, getDeliveryNotesCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Obtener albarán
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del albarán }
 *       404: { description: Albarán no encontrado }
 */
router.get('/:id', authMiddleware, getDeliveryNoteCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}/pdf:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Descargar PDF del albarán
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404: { description: Albarán no encontrado }
 */
router.get('/:id/pdf', authMiddleware, getDeliveryNotePDFCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   put:
 *     tags: [DeliveryNotes]
 *     summary: Actualizar albarán
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               workDate: { type: string }
 *               material: { type: string }
 *               quantity: { type: number }
 *               hours: { type: number }
 *     responses:
 *       200: { description: Albarán actualizado }
 *       400: { description: Albarán firmado no puede modificarse }
 */
router.put('/:id', authMiddleware, validate(updateDeliveryNoteSchema), updateDeliveryNoteCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}/send:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Enviar albarán por email
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán enviado }
 */
router.patch('/:id/send', authMiddleware, sendDeliveryNoteCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Firmar albarán
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signedBy: { type: string }
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Albarán firmado }
 */
router.patch('/:id/sign', authMiddleware, validate(signDeliveryNoteSchema), signDeliveryNoteCtrl);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags: [DeliveryNotes]
 *     summary: Eliminar albarán
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán eliminado }
 *       400: { description: Albarán firmado no puede eliminarse }
 */
router.delete('/:id', authMiddleware, deleteDeliveryNoteCtrl);

export default router;