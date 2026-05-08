import DeliveryNote from '../models/deliveryNote.model.js';
import Counter from '../models/Counter.js';
import Project from '../models/project.model.js';
import Client from '../models/client.model.js';
import { AppError } from '../utils/AppError.js';
import { uploadImage } from '../services/storage.service.js';
import { getIO } from '../config/socket.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';

/// F13: Contador atomico con findOneAndUpdate + $inc (reemplaza regex + sort)
const generateSequentialNumber = async (companyId) => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { company: companyId, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `ALB-${year}-${counter.seq.toString().padStart(4, '0')}`;
};

export const createDeliveryNoteCtrl = async (req, res, next) => {
  try {
    const { project, client, format, description, workDate, items, notes, taxRate } = req.body;

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
      format: format || 'hours',
      description,
      workDate: workDate ? new Date(workDate) : new Date(),
      items,
      notes,
      taxRate: taxRate || 21
    });

    try {
      const io = getIO();
      io.to(`company:${req.user.company}`).emit('deliverynote:new', { deliveryNote });
    } catch (e) {}

    res.status(201).json({ data: deliveryNote });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNotesCtrl = async (req, res, next) => {
  try {
    const { project, client, format, status, from, to, page = 1, limit = 10, sort = '-workDate' } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (status) filter.status = status;

    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
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

    const allowedFields = ['format', 'description', 'items', 'workDate', 'notes', 'taxRate'];
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
    deliveryNote.signed = true;
    deliveryNote.signedBy = signedBy;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureUrl;
    await deliveryNote.save();

    try {
      const io = getIO();
      io.to(`company:${req.user.company}`).emit('deliverynote:signed', { deliveryNote });
    } catch (e) {
    }

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
    } catch (e) {
    }

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

    /// F13: Verificacion status signed antes de borrado (soft y hard)
    if (deliveryNote.status === 'signed') {
      throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
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
