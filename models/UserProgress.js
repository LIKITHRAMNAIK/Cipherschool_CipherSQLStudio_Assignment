const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true,
  },
  sqlQuery: {
    type: String,
    default: '',
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  attemptCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

userProgressSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);

