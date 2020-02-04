const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  code: { type: String, required: true },
  used: { type: Boolean, required: true, default: false },
  infinite: { type: Boolean, required: false, default: false },
  usedBy: { type: String, required: false },
});

module.exports = mongoose.model('invites', inviteSchema, 'invites');
