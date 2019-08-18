const mongoose = require('mongoose');
const paginate = require('mongoose-paginate');

let suggestionsSchema = new mongoose.Schema({
    data: { type: Object, required: true },
    time: { type: Number, required: true },
    username: { type: String, required: true }
});

suggestionsSchema.plugin(paginate);

module.exports = mongoose.model('suggestions', suggestionsSchema, 'suggestions');