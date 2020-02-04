const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  group: { type: String, required: true },
  data: {},
});

userSchema.methods.hashPassword = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync());

userSchema.methods.comparePassword = (password, hash) => bcrypt.compareSync(password, hash);

module.exports = mongoose.model('users', userSchema, 'users');
