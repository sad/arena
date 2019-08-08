const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const group = require("./group");

let userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    group: { type: String, required: true },
    data: {}
});

userSchema.methods.hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
}

userSchema.methods.comparePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
}

/*userSchema.methods.hasPermission = (user, permission) => {
    return new Promise((resolve, reject) => {
        group.findOne({name: user.group}, (err, group) => {
            if(err) reject(err);
            resolve(group.permissions.includes(permission) || group.permissions.includes("*"));
        });
    });
}*/

module.exports = mongoose.model('users', userSchema, 'users');

