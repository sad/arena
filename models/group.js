const mongoose = require('mongoose');

let groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    permissions: [{ type: String }],
    nondefault: { type: Boolean, required: false }
});

groupSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('*');
}

module.exports = mongoose.model('group', groupSchema);

