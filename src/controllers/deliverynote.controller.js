import DeliveryNote from '../models/deliveryNote.model.js';
import Project from '../models/project.model.js';
import { AppError } from '../utils/AppError.js';
import userEvents from '../services/notification.service.js';

const generateSequentialNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `ALB-${year}-`;

  const lastNote = await DeliveryNote.find({
    company: companyId,
    sequentialNumber: { $regex: `^${prefix}` }
  }).sort({ sequentialNumber: -1 }).limit(1);

  let nextNumber = 1;
  if (lastNote.length > 0) {
    const lastSeq = lastNote[0].sequentialNumber;
    const lastNum = parseInt(lastSeq.split('-')[2]);
    nextNumber = lastNum + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

export const createDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { project, client, type, date, items, taxRate, notes } = req.body;

    const projectExists = await Project.findOne({
      _id: project,
      company: req.user.company,
      deleted: false
    });
    if (!projectExists) {
      throw AppError.notFound('PROYECTO');
    }

    const sequentialNumber = await generateSequentialNumber(req.user.company);

    const deliveryNote = await DeliveryNote.create({
      company: req.user.company,
      project,
      client,
      sequentialNumber,
      type: type || 'hours',
      date: date ? new Date(date) : Date.now(),
      items,
      taxRate: taxRate || 21,
      notes
    });

    res.status(201).json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNotesCtrl = async (req, res, next) => {
  try {
    const { project, client, status } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (status) filter.status = status;

    const deliveryNotes = await DeliveryNote.find(filter)
      .populate('client', 'name')
      .populate('project', 'name')
      .sort({ date: -1 });

    res.json({ data: deliveryNotes });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    }).populate('client', 'name email')
      .populate('project', 'name');

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    res.json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    if (deliveryNote.status === 'signed') {
      throw AppError.badRequest('NO SE PUEDE MODIFICAR UN ALBARAN FIRMADO');
    }

    const updated = await DeliveryNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

export const signDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { signedBy } = req.body;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    if (deliveryNote.status === 'signed') {
      throw AppError.badRequest('YA ESTA FIRMADO');
    }

    deliveryNote.status = 'signed';
    deliveryNote.signedBy = signedBy;
    deliveryNote.signedAt = new Date();
    await deliveryNote.save();

    userEvents.emit('deliverynote.signed', deliveryNote);

    res.json({ data: deliveryNote, message: 'ALBARAN FIRMADO' });
  } catch (err) {
    next(err);
  }
};

export const sendDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    deliveryNote.status = 'sent';
    await deliveryNote.save();

    userEvents.emit('deliverynote.sent', deliveryNote);

    res.json({ data: deliveryNote, message: 'ALBARAN ENVIADO' });
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true') {
      await DeliveryNote.findOneAndDelete({
        _id: req.params.id,
        company: req.user.company
      });
    } else {
      await DeliveryNote.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true, deletedAt: new Date() }
      );
    }

    res.json({ message: 'ALBARAN ELIMINADO' });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNotePDFCtrl = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    }).populate('client', 'name email nif')
      .populate('project', 'name');

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    res.json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};