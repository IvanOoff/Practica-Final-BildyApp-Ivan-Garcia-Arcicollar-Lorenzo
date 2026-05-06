import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'EL USUARIO ES REQUERIDO']
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'LA EMPRESA ES REQUERIDA']
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'EL CLIENTE ES REQUERIDO']
    },
    name: {
      type: String,
      required: [true, 'EL NOMBRE ES REQUERIDO'],
      trim: true,
      minlength: [2, 'MINIMO 2 CARACTERES'],
      maxlength: [200, 'MAXIMO 200 CARACTERES']
    },
    projectCode: {
      type: String,
      required: [true, 'EL CODIGO DE PROYECTO ES REQUERIDO'],
      unique: true,
      trim: true,
      uppercase: true
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      number: { type: String, trim: true, maxlength: 20 },
      postal: { type: String, trim: true, maxlength: 10 },
      city: { type: String, trim: true, maxlength: 100 },
      province: { type: String, trim: true, maxlength: 100 }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'EMAIL NO VALIDO']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'MAXIMO 1000 CARACTERES']
    },
    active: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'completed', 'cancelled'],
        message: '{VALUE} NO ES UN ESTADO VALIDO'
      },
      default: 'pending'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

projectSchema.index({ company: 1, deleted: 1 });
projectSchema.index({ client: 1, deleted: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;