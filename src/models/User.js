// ESTRUCTURA DE DATOS DEL USUARUIO EN MONGODB.
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'EMAIL REQUERIDO'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'CONTRASEÑA REQUERIDA'],
      minlength: 8,
      select: false
    },
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    nif: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[0-9]{8}[A-Z]$/, 'NIF inválido']
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'guest'],
        message: '{VALUE} no es un rol válido'
      },
      default: 'admin'
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'verified'],
        message: '{VALUE} no es un estado válido'
      },
      default: 'pending'
    },
    verificationCode: {
      type: String,
      default: null
    },
    verificationCodeExpires: {
      type: Date,
      default: null
    },
    verificationAttempts: {
      type: Number,
      default: 3,
      max: 3
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
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
    versionKey: false,
    toJSON: { virtuals: true }
  }
);

userSchema.index({ company: 1, deleted: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

userSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.lastName}`;
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationCode;
  delete user.verificationCodeExpires;
  delete user.verificationAttempts;
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
