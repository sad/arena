const users = require('../models/user');

let makeID = (length) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

let getUserCount = () => {
    users.find({}, (err, doc) => {
        if(!err) return doc.length;
    });
}

module.exports = { makeID, getUserCount }