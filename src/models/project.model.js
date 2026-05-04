//
import mongoose from 'mongoose';
const projectSchema = new mongoose.Schema(
  {
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
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'MAXIMO 1000 CARACTERES']
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
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'NO PUEDE SER NEGATIVO']
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