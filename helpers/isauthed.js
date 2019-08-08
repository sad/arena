const helper = require('./ops.js');

module.exports = (permission) => {
    return (req, res, next) => {
        if(req.isAuthenticated()) {
            helper.hasPermission(req.user, permission).then((perm) => {
                if(perm) return next();
                req.flash('info', 'you don\'t have permission to view that');
                return res.redirect('back');
            });
        }else {
            return res.redirect('/login');
        }
    }
}