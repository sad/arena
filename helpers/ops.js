const users = require('../models/user');
const groups = require('../models/group');

const makeID = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const getUserCount = () => {
  users.find({}, (err, doc) => {
    if (!err) return doc.length;
  });
};

const toHHMMSS = (str) => {
  const secNum = parseInt(str, 10);
  let hours = Math.floor(secNum / 3600);
  let minutes = Math.floor((secNum - (hours * 3600)) / 60);
  let seconds = secNum - (hours * 3600) - (minutes * 60);

  if (hours < 10) { hours = `0${hours}`; }
  if (minutes < 10) { minutes = `0${minutes}`; }
  if (seconds < 10) { seconds = `0${seconds}`; }
  const time = `${hours}:${minutes}:${seconds}`;

  return time;
};

const hasPermission = (user, permission) => new Promise((resolve, reject) => {
  groups.findOne({ name: user.group }, (err, doc) => {
    if (err || !doc) reject(new Error('invalid document'));
    if (doc.permissions.includes(permission) || doc.permissions.includes('*')) resolve(true);
  });
});

module.exports = {
  makeID, getUserCount, toHHMMSS, hasPermission,
};
