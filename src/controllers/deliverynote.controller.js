import DeliveryNote from '../models/deliveryNote.model.js';
import Project from '../models/project.model.js';
import Client from '../models/client.model.js';
import { AppError } from '../utils/AppError.js';
import { uploadImage } from '../services/storage.service.js';
import { getIO } from '../config/socket.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';

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
    const { project, client, type, items, date, notes, taxRate } = req.body;

    const projectExists = await Project.findOne({
      _id: project,
      company: req.user.company,
      deleted: false
    });
    if (!projectExists) {
      throw AppError.notFound('PROYECTO');
    }

    const clientExists = await Client.findOne({
      _id: client,
      company: req.user.company,
      deleted: false
    });
    if (!clientExists) {
      throw AppError.notFound('CLIENTE');
    }

    const sequentialNumber = await generateSequentialNumber(req.user.company);

    const deliveryNote = await DeliveryNote.create({
      user: req.user._id,
      company: req.user.company,
      project,
      client,
      sequentialNumber,
      type: type || 'hours',
      items,
      date: date ? new Date(date) : new Date(),
      notes,
      taxRate: taxRate || 21
    });

    try {
      const io = getIO();
      io.to(`company:${req.user.company}`).emit('deliverynote:new', { deliveryNote });
    } catch (e) { /* Socket.IO not initialized in tests */ }

    res.status(201).json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNotesCtrl = async (req, res, next) => {
  try {
    const { project, client, type, status, from, to, page = 1, limit = 10, sort = '-date' } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (type) filter.type = type;
    if (status) filter.status = status;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [deliveryNotes, total] = await Promise.all([
      DeliveryNote.find(filter)
        .populate('client', 'name email')
        .populate('project', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      DeliveryNote.countDocuments(filter)
    ]);

    res.json({
      data: deliveryNotes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
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
    })
      .populate('client', 'name email cif address')
      .populate('project', 'name projectCode address')
      .populate('user', 'name email');

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

    const allowedFields = ['type', 'items', 'date', 'notes', 'taxRate'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        deliveryNote[field] = req.body[field];
      }
    });

    await deliveryNote.save();

    res.json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};

export const signDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { signedBy, signature } = req.body;

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

    let signatureUrl = null;
    if (signature) {
      const signatureBuffer = Buffer.from(signature.split(',')[1], 'base64');
      const result = await uploadImage(signatureBuffer, 'bildyapp/signatures');
      signatureUrl = result.secure_url;
    }

    deliveryNote.status = 'signed';
    deliveryNote.signedBy = signedBy;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureUrl;
    await deliveryNote.save();

    try {
      const io = getIO();
      io.to(`company:${req.user.company}`).emit('deliverynote:signed', { deliveryNote });
    } catch (e) { /* Socket.IO not initialized in tests */ }

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

    try {
      const io = getIO();
      io.to(`company:${req.user.company}`).emit('deliverynote:sent', { deliveryNote });
    } catch (e) { /* Socket.IO not initialized in tests */ }

    res.json({ data: deliveryNote, message: 'ALBARAN ENVIADO' });
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { permanent } = req.query;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    if (permanent === 'true') {
      await DeliveryNote.findByIdAndDelete(req.params.id);
    } else {
      deliveryNote.deleted = true;
      deliveryNote.deletedAt = new Date();
      await deliveryNote.save();
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
    })
      .populate('client', 'name email cif address')
      .populate('project', 'name projectCode address')
      .populate('user', 'name email');

    if (!deliveryNote) {
      throw AppError.notFound('ALBARAN');
    }

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=albaran-${deliveryNote.sequentialNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
