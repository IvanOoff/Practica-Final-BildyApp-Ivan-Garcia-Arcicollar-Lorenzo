import Client from '../models/client.model.js';
import { AppError } from '../utils/AppError.js';

export const createClientCtrl = async (req, res, next) => {
  try {
    const { name, email, phone, contactPerson, nif, address } = req.body;

    const existingClient = await Client.findOne({
      company: req.user.company,
      email
    });
    if (existingClient) {
      throw AppError.conflict('EL CLIENTE YA EXISTE');
    }

    const client = await Client.create({
      user: req.user._id,
      company: req.user.company,
      name,
      email,
      phone,
      contactPerson,
      nif,
      address
    });

    res.status(201).json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const getClientsCtrl = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name,sort = '-createdAt' } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort(sort.replace('-', ''))
        .skip(skip)
        .limit(parseInt(limit)),
      Client.countDocuments(filter)
    ]);

    res.json({
      data: clients,
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

export const getClientCtrl = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!client) {
      throw AppError.notFound('CLIENTE');
    }

    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const updateClientCtrl = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      throw AppError.notFound('CLIENTE');
    }

    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const deleteClientCtrl = async (req, res, next) => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true') {
      await Client.findOneAndDelete({
        _id: req.params.id,
        company: req.user.company
      });
    } else {
      await Client.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true, deletedAt: new Date() }
      );
    }

    res.json({ message: 'CLIENTE ELIMINADO' });
  } catch (err) {
    next(err);
  }
};

export const getArchivedClientsCtrl = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-deletedAt' } = req.query;

    const filter = { company: req.user.company, deleted: true };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort(sort.replace('-', ''))
        .skip(skip)
        .limit(parseInt(limit)),
      Client.countDocuments(filter)
    ]);

    res.json({
      data: clients,
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

export const restoreClientCtrl = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false, deletedAt: null },
      { new: true, runValidators: true }
    );

    if (!client) {
      throw AppError.notFound('CLIENTE');
    }

    res.json({ data: client, message: 'CLIENTE RESTAURADO' });
  } catch (err) {
    next(err);
  }
};