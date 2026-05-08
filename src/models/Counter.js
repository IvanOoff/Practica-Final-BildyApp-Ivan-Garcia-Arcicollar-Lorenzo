import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

counterSchema.index({ company: 1, year: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;