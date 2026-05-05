import { Router } from 'express';
import {
  createProjectCtrl,
  getProjectsCtrl,
  getProjectCtrl,
  updateProjectCtrl,
  changeStatusProjectCtrl,
  deleteProjectCtrl,
  getArchivedProjectsCtrl,
  restoreProjectCtrl
} from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema, changeStatusSchema } from '../validators/project.validator.js';

const router = Router();

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags: [Projects]
 *     summary: Crear proyecto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, client]
 *             properties:
 *               name: { type: string }
 *               projectCode: { type: string }
 *               client: { type: string }
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   number: { type: string }
 *                   postal: { type: string }
 *                   city: { type: string }
 *                   province: { type: string }
 *               email: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Proyecto creado }
 *       400: { description: Error de validación }
 */
router.post('/', authMiddleware, validate(createProjectSchema), createProjectCtrl);

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt' }
 *     responses:
 *       200: { description: Lista de proyectos }
 */
router.get('/', authMiddleware, getProjectsCtrl);

/**
 * @openapi
 * /api/project/archived:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos archivados
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Lista de proyectos archivados }
 */
router.get('/archived', authMiddleware, getArchivedProjectsCtrl);

/**
 * @openapi
 * /api/project/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Obtener proyecto
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del proyecto }
 *       404: { description: Proyecto no encontrado }
 */
router.get('/:id', authMiddleware, getProjectCtrl);

/**
 * @openapi
 * /api/project/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Actualizar proyecto
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
 *               projectCode: { type: string }
 *               client: { type: string }
 *               email: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Proyecto actualizado }
 */
router.put('/:id', authMiddleware, validate(updateProjectSchema), updateProjectCtrl);

/**
 * @openapi
 * /api/project/{id}/status:
 *   patch:
 *     tags: [Projects]
 *     summary: Cambiar estado de proyecto
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
 *             required: [active]
 *             properties:
 *               active: { type: boolean }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.patch('/:id/status', authMiddleware, validate(changeStatusSchema), changeStatusProjectCtrl);

/**
 * @openapi
 * /api/project/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Eliminar proyecto
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
 *       200: { description: Proyecto eliminado }
 */
router.delete('/:id', authMiddleware, deleteProjectCtrl);

/**
 * @openapi
 * /api/project/{id}/restore:
 *   patch:
 *     tags: [Projects]
 *     summary: Restaurar proyecto archivado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proyecto restaurado }
 *       404: { description: Proyecto no encontrado }
 */
router.patch('/:id/restore', authMiddleware, restoreProjectCtrl);

export default router;