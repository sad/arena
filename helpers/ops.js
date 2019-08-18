const users = require('../models/user');
const groups = require('../models/group');

let makeID = (length) => {
    let result = '',
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

let getUserCount = () => {
    users.find({}, (err, doc) => {
        if(!err) return doc.length;
    });
}

let toHHMMSS = (str) => {
    let secNum = parseInt(str, 10),
    hours = Math.floor(secNum / 3600),
    minutes = Math.floor((secNum - (hours * 3600)) / 60),
    seconds = secNum - (hours * 3600) - (minutes * 60);

    if(hours < 10) { hours = "0"+ hours };
    if(minutes < 10) { minutes = "0"+ minutes };
    if(seconds < 10) { seconds = "0"+ seconds };
    var time = `${hours}:${minutes}:${seconds}`;

    return time;
}

let hasPermission = (user, permission) => {
    return new Promise((resolve, reject) => {
        groups.findOne({name: user.group}, (err, doc) => {
            if(err || !doc) reject('invalid document');
            if(doc.permissions.includes(permission) || doc.permissions.includes('*')) resolve(true);
        });
    });
}

module.exports = { makeID, getUserCount, toHHMMSS, hasPermission }