import Project from '../models/project.model.js';
import Client from '../models/client.model.js';
import { AppError } from '../utils/AppError.js';

export const createProjectCtrl = async (req, res, next) => {
  try {
    const { client, name, description, startDate } = req.body;

    const clientExists = await Client.findOne({
      _id: client,
      company: req.user.company,
      deleted: false
    });
    if (!clientExists) {
      throw AppError.notFound('CLIENTE NO ENCONTRADO');
    }

    const project = await Project.create({
      company: req.user.company,
      client,
      name,
      description,
      startDate: startDate ? new Date(startDate) : Date.now()
    });

    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const getProjectsCtrl = async (req, res, next) => {
  try {
    const { client, status } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (client) filter.client = client;
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProjectCtrl = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    }).populate('client', 'name email');

    if (!project) {
      throw AppError.notFound('PROYECTO');
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProjectCtrl = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      throw AppError.notFound('PROYECTO');
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const changeStatusProjectCtrl = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updateData = { status };

    if (status === 'completed') {
      updateData.endDate = new Date();
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      throw AppError.notFound('PROYECTO');
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProjectCtrl = async (req, res, next) => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true') {
      await Project.findOneAndDelete({
        _id: req.params.id,
        company: req.user.company
      });
    } else {
      await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true, deletedAt: new Date() }
      );
    }

    res.json({ message: 'PROYECTO ELIMINADO' });
  } catch (err) {
    next(err);
  }
};