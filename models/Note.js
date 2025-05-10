const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topics: [{ type: String }],
  filePath: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);