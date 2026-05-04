import { Router } from 'express';
import {
  createProjectCtrl,
  getProjectsCtrl,
  getProjectCtrl,
  updateProjectCtrl,
  changeStatusProjectCtrl,
  deleteProjectCtrl
} from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema, changeStatusSchema } from '../validators/project.validator.js';

const router = Router();

router.post('/', authMiddleware, validate(createProjectSchema), createProjectCtrl);
router.get('/', authMiddleware, getProjectsCtrl);
router.get('/:id', authMiddleware, getProjectCtrl);
router.put('/:id', authMiddleware, validate(updateProjectSchema), updateProjectCtrl);
router.patch('/:id/status', authMiddleware, validate(changeStatusSchema), changeStatusProjectCtrl);
router.delete('/:id', authMiddleware, deleteProjectCtrl);

export default router;