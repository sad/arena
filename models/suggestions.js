const mongoose = require('mongoose');

/*
    data: {
        "rules": ["one, two"],
        "samples": ["link", "link"]
    }

    on suggest page -> js to add samples or rules to the form idk its cooler in my head
*/

let suggestionsSchema = new mongoose.Schema({
    data: { type: Object, required: true },
    time: { type: Number, required: true },
    username: { type: String, required: true }
});

module.exports = mongoose.model('suggestions', suggestionsSchema, 'suggestions');