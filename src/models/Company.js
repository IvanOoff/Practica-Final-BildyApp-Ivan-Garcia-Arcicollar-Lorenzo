// ESTRUCTURA DE DATOS DE LA EMPRESA EN MONGODB.
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El propietario es requerido']
    },
    name: {
      type: String,
      required: [true, 'El nombre de la empresa es requerido'],
      trim: true,
      minlength: 2,
      maxlength: 200
    },
    cif: {
      type: String,
      required: [true, 'El CIF es requerido'],
      unique: true,
      trim: true,
      match: [/^[0-9]{8}[A-Z]$/, 'CIF no válido']
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      number: { type: String, trim: true, maxlength: 20 },
      postal: { type: String, trim: true, maxlength: 10 },
      city: { type: String, trim: true, maxlength: 100 },
      province: { type: String, trim: true, maxlength: 100 }
    },
    logo: {
      type: String,
      default: null
    },
    isFreelance: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

companySchema.index({ owner: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
