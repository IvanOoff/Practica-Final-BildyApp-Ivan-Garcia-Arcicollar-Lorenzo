import { Router } from 'express';
import {
  createClientCtrl,
  getClientsCtrl,
  getClientCtrl,
  updateClientCtrl,
  deleteClientCtrl
} from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.post('/', authMiddleware, validate(createClientSchema), createClientCtrl);
router.get('/', authMiddleware, getClientsCtrl);
router.get('/:id', authMiddleware, getClientCtrl);
router.put('/:id', authMiddleware, validate(updateClientSchema), updateClientCtrl);
router.delete('/:id', authMiddleware, deleteClientCtrl);

export default router;