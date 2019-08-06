const mongoose = require('mongoose');

let bulletinSchema = new mongoose.Schema({
    message: { type: String, required: true },
    time: { type: Number, required: true }
});

module.exports = mongoose.model('bulletin', bulletinSchema, 'bulletin');