const groups = require('../models/group');

module.exports = (permission) => (req, res, next) => {
  if (req.isAuthenticated()) {
    groups.findOne({ name: req.user.group }, (err, doc) => {
      if (doc && req.user.group === 'banned') return res.redirect('/logout');
      if (doc) {
        if (doc.permissions.includes(permission) || doc.permissions.includes('*')) return next();
      }

      req.flash('info', 'you don\'t have permission to view that');
      return res.redirect('back');
    });
  } else {
    return res.redirect('/login');
  }
  return true;
};
