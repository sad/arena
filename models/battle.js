const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: String, required: true },
  description: { type: String, required: false },
  ruleset: { type: Array, required: true },
  rulesetContributor: { type: String, required: false },
  expiry: { type: Date, required: true },
  voteLength: { type: Date, required: true },
  submissions: { type: Object, required: false },
  info: { type: Object, required: false },
});

module.exports = mongoose.model('battles', battleSchema, 'battles');
