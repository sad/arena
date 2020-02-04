const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: [{ type: String }],
  nondefault: { type: Boolean, required: false },
});

groupSchema.methods.hasPermission = (permission) => this.permissions.includes(permission) || this.permissions.includes('*');

module.exports = mongoose.model('group', groupSchema);
