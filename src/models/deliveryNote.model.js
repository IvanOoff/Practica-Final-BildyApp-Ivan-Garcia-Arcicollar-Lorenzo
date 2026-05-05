import mongoose from 'mongoose';

const deliveryNoteItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'LA DESCRIPCION ES REQUERIDA'],
      trim: true,
      maxlength: [500, 'MAXIMO 500 CARACTERES']
    },
    quantity: {
      type: Number,
      required: [true, 'LA CANTIDAD ES REQUERIDA'],
      min: [0, 'NO PUEDE SER NEGATIVA']
    },
    unit: {
      type: String,
      required: [true, 'LA UNIDAD ES REQUERIDA'],
      enum: {
        values: ['hours', 'units', 'kg', 'm', 'km', 'liters', 'packages'],
        message: '{VALUE} NO ES UNA UNIDAD VALIDA'
      }
    },
    price: {
      type: Number,
      required: [true, 'EL PRECIO ES REQUERIDO'],
      min: [0, 'NO PUEDE SER NEGATIVO']
    },
    total: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const deliveryNoteSchema = new mongoose.Schema(
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'EL PROYECTO ES REQUERIDO']
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'EL CLIENTE ES REQUERIDO']
    },
    sequentialNumber: {
      type: String,
      required: [true, 'EL NUMERO SECUENCIAL ES REQUERIDO']
    },
    type: {
      type: String,
      enum: {
        values: ['hours', 'materials', 'mixed'],
        message: '{VALUE} NO ES UN TIPO VALIDO'
      },
      default: 'hours'
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'signed', 'cancelled'],
        message: '{VALUE} NO ES UN ESTADO VALIDO'
      },
      default: 'draft'
    },
    date: {
      type: Date,
      default: Date.now
    },
    items: [deliveryNoteItemSchema],
    subtotal: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 21,
      min: [0, 'NO PUEDE SER NEGATIVO'],
      max: [100, 'MAXIMO 100%']
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    signedBy: {
      type: String,
      trim: true,
      maxlength: [200, 'MAXIMO 200 CARACTERES']
    },
    signedAt: {
      type: Date,
      default: null
    },
    signatureUrl: {
      type: String,
      default: null
    },
    pdfUrl: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'MAXIMO 1000 CARACTERES']
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

deliveryNoteItemSchema.pre('save', function() {
  this.total = this.quantity * this.price;
});

deliveryNoteSchema.pre('save', function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  this.taxAmount = this.subtotal * (this.taxRate / 100);
  this.totalAmount = this.subtotal + this.taxAmount;
});

deliveryNoteSchema.index({ company: 1, deleted: 1 });
deliveryNoteSchema.index({ project: 1, deleted: 1 });
deliveryNoteSchema.index({ client: 1, deleted: 1 });
deliveryNoteSchema.index({ sequentialNumber: 1 }, { unique: true });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;
