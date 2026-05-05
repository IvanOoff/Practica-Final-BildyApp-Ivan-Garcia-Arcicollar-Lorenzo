import { Router } from 'express';
import {
  createClientCtrl,
  getClientsCtrl,
  getClientCtrl,
  updateClientCtrl,
  deleteClientCtrl,
  getArchivedClientsCtrl,
  restoreClientCtrl
} from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags: [Clients]
 *     summary: Crear cliente
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   number: { type: string }
 *                   postal: { type: string }
 *                   city: { type: string }
 *                   province: { type: string }
 *     responses:
 *       201: { description: Cliente creado }
 *       400: { description: Error de validación }
 */
router.post('/', authMiddleware, validate(createClientSchema), createClientCtrl);

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: 'createdAt' }
 *     responses:
 *       200: { description: Lista de clientes }
 */
router.get('/', authMiddleware, getClientsCtrl);

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes archivados
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Lista de clientes archivados }
 */
router.get('/archived', authMiddleware, getArchivedClientsCtrl);

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener cliente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del cliente }
 *       404: { description: Cliente no encontrado }
 */
router.get('/:id', authMiddleware, getClientCtrl);

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags: [Clients]
 *     summary: Actualizar cliente
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
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Cliente actualizado }
 */
router.put('/:id', authMiddleware, validate(updateClientSchema), updateClientCtrl);

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Eliminar cliente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200: { description: Cliente eliminado }
 */
router.delete('/:id', authMiddleware, deleteClientCtrl);

/**
 * @openapi
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Clients]
 *     summary: Restaurar cliente archivado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente restaurado }
 *       404: { description: Cliente no encontrado }
 */
router.patch('/:id/restore', authMiddleware, restoreClientCtrl);

export default router;