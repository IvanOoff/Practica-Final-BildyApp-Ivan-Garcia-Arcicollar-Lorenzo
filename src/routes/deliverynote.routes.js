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

router.post('/', authMiddleware, validate(createDeliveryNoteSchema), createDeliveryNoteCtrl);
router.get('/', authMiddleware, getDeliveryNotesCtrl);
router.get('/:id', authMiddleware, getDeliveryNoteCtrl);
router.put('/:id', authMiddleware, validate(updateDeliveryNoteSchema), updateDeliveryNoteCtrl);
router.patch('/:id/send', authMiddleware, sendDeliveryNoteCtrl);
router.patch('/:id/sign', authMiddleware, validate(signDeliveryNoteSchema), signDeliveryNoteCtrl);
router.delete('/:id', authMiddleware, deleteDeliveryNoteCtrl);

export default router;