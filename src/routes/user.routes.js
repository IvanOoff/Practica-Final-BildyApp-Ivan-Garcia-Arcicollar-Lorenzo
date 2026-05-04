import { Router } from 'express';
import {
  registerCtrl,
  validateCtrl,
  loginCtrl,
  refreshCtrl,
  logoutCtrl,
  meCtrl,
  updateProfileCtrl,
  changePasswordCtrl,
  deleteCtrl,
  getCompanyCtrl,
  createCompanyCtrl,
  joinCompanyCtrl,
  updateCompanyCtrl,
  uploadLogoCtrl,
  inviteUserCtrl
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import uploadMiddleware from '../middleware/upload.js';
import {
  validatorRegister,
  validatorLogin,
  validatorValidate,
  validatorUpdateProfile,
  validatorChangePassword,
  validatorRefresh,
  validatorCreateCompany,
  validatorUpdateCompany,
  validatorInviteUser
} from '../validators/user.validator.js';

const router = Router();

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201: { description: Usuario creado }
 *       400: { description: Error de validación }
 *       409: { description: Email ya existe }
 */
router.post('/register', validate(validatorRegister), registerCtrl);

/**
 * @openapi
 * /api/user/validation:
 *   put:
 *     tags: [Auth]
 *     summary: Validar email con código
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *     responses:
 *       200: { description: Email validado }
 *       400: { description: Código inválido }
 */
router.put('/validation', authMiddleware, validate(validatorValidate), validateCtrl);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso }
 *       401: { description: Credenciales inválidas }
 */
router.post('/login', validate(validatorLogin), loginCtrl);

/**
 * @openapi
 * /api/user/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Token renovado }
 */
router.post('/refresh', validate(validatorRefresh), refreshCtrl);

/**
 * @openapi
 * /api/user/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Sesión cerrada }
 */
router.post('/logout', authMiddleware, logoutCtrl);

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags: [User]
 *     summary: Obtener usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 *       401: { description: No autorizado }
 *   put:
 *     tags: [User]
 *     summary: Actualizar perfil
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       200: { description: Perfil actualizado }
 *   delete:
 *     tags: [User]
 *     summary: Eliminar cuenta
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cuenta eliminada }
 */
router.get('/', authMiddleware, meCtrl);
router.put('/register', authMiddleware, validate(validatorUpdateProfile), updateProfileCtrl);
router.put('/password', authMiddleware, validate(validatorChangePassword), changePasswordCtrl);
router.delete('/', authMiddleware, deleteCtrl);

/**
 * @openapi
 * /api/user/company:
 *   get:
 *     tags: [Company]
 *     summary: Ver empresa del usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos de la empresa }
 *   put:
 *     tags: [Company]
 *     summary: Actualizar empresa
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *     responses:
 *       200: { description: Empresa actualizada }
 *   patch:
 *     tags: [Company]
 *     summary: Crear empresa
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
 *     responses:
 *       200: { description: Empresa creada/actualizada }
 */
router.patch('/company', authMiddleware, validate(validatorCreateCompany), createCompanyCtrl);
router.patch('/company/join', authMiddleware, joinCompanyCtrl);
router.get('/company', authMiddleware, getCompanyCtrl);
router.put('/company', authMiddleware, validate(validatorUpdateCompany), updateCompanyCtrl);

/**
 * @openapi
 * /api/user/logo:
 *   patch:
 *     tags: [Company]
 *     summary: Subir logo de empresa
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Logo subido }
 */
router.patch('/logo', authMiddleware, uploadMiddleware.single('file'), uploadLogoCtrl);

/**
 * @openapi
 * /api/user/invite:
 *   post:
 *     tags: [Company]
 *     summary: Invitar usuario a empresa
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Invitación enviada }
 */
router.post('/invite', authMiddleware, validate(validatorInviteUser), inviteUserCtrl);

export default router;
