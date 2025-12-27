const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  columnName: {
    type: String,
    required: true,
  },
  dataType: {
    type: String,
    required: true,
  },
}, { _id: false });

const sampleTableSchema = new mongoose.Schema({
  tableName: {
    type: String,
    required: true,
  },
  columns: {
    type: [columnSchema],
    required: true,
  },
  rows: {
    type: [mongoose.Schema.Types.Mixed],
    required: true,
  },
}, { _id: false });

const expectedOutputSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['table', 'single_value', 'column', 'count', 'row'],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  sampleTables: {
    type: [sampleTableSchema],
    required: true,
  },
  expectedOutput: {
    type: expectedOutputSchema,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Assignment', assignmentSchema);

