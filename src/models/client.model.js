
// definicion de los clientes -> nombre, email,numero de telefono y más. 
import mongoose from 'mongoose';
const clientSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'LA EMPRESA ES REQUERIDA']
    },
    name: {
      type: String,
      required: [true, 'EL NOMBRE ES REQUERIDO'],
      trim: true,
      minlength: [2, 'MINIMO 2 CARACTERES'],
      maxlength: [200, 'MAXIMO 200 CARACTERES']
    },
    email: {
      type: String,
      required: [true, 'EL EMAIL ES REQUERIDO'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'EMAIL NO VALIDO']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'MAXIMO 20 CARACTERES']
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'MAXIMO 100 CARACTERES']
    },
    nif: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{8}[A-Z]$/, 'NIF NO VALIDO']
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      number: { type: String, trim: true, maxlength: 20 },
      postal: { type: String, trim: true, maxlength: 10 },
      city: { type: String, trim: true, maxlength: 100 },
      province: { type: String, trim: true, maxlength: 100 }
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
clientSchema.index({ company: 1, deleted: 1 });
const Client = mongoose.model('Client', clientSchema);
export default Client;