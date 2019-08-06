const mongoose = require('mongoose');

let groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    permissions: [{ type: String }]
});


module.exports = mongoose.model('group', groupSchema);

