let express = require('express');
let router = express.Router();
let user = require('../models/user');
let invites = require('../models/invites');

module.exports = (passport) => {
    router.post('/signup', (req, res, next) => {
        let username = req.body.username,
            password = req.body.password,
            code = req.body.code,
            usernameRegex = /^[a-zA-Z0-9-_]+$/;

        if(!username || !password || !code) {
            req.flash('info', 'required fields not filled');
            return res.redirect('back');
        }

        if(username.length < 3 || username.length > 12) { 
            req.flash('info', 'username must be between 3 and 12 characters'); 
        }

        if(username.search(usernameRegex) == -1) {
            req.flash('info', 'invalid characters in username');
        }

        if(password.length < 8) { 
            req.flash('info', 'password must be at least 8 characters'); 
        }

        user.findOne({username: username}, (err, doc) => {
            if(err) return res.status(500).redirect('back');
            if(doc) {
                req.flash('info', 'user already exists.');
                return res.redirect('back');
            }

            invites.findOne({code: code}, (err, doc) => {
                if(err || !doc || doc.used) {
                    req.flash('info', ' invalid invite code ')
                    return res.redirect('back');
                }

                if(!doc.infinite || doc.infinite == undefined) {
                    invites.updateOne({code: code}, {$set: { used: true, usedBy: username }}, (err, doc => {
                        if(err) {
                            req.flash('info', `error using invite ${code}`);
                            return res.redirect('back');
                        }
                    }));
                }

                let record = new user({
                    username: username,
                    group: "user",
                    data: {
                        "joined": +new Date,
                        "badges": {
                            "fas fa-cog": "beta tester"
                        },
                        "battles": {
                            "participated": 0,
                            "won": 0
                        }
                    }
                });

                if(code == "admin") {
                    record.group = "admin";
                    record.data.badges["fas fa-code"] = "administrator";
                }

                record.password = record.hashPassword(password);
                record.save((err, result) => {
                    if(err) {
                        req.flash('info', 'error creating account');
                        return res.redirect('back');
                    }
                    req.flash('info', 'account created! please sign in');
                    return res.redirect('/profile'); // redirect to /welcome maybe, redirecting back to / doesnt work and unaths
                });
            });
        });
    });

    router.post('/login', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if(err) return res.redirect('back');
            if(!user) {
                req.flash('info', 'invalid username or password');
                return res.redirect('back');
            }

            req.logIn(user, (err) => {
                if(err) {
                    req.flash('info', 'error signing in');
                    return res.redirect('back');
                }

                if(user.group == 'banned') {
                    req.flash('info', 'your account has been disabled');
                    req.logout();
                    return res.redirect('back');
                }
                return res.redirect('/');
            })
        })(req, res, next);
    });

    return router;
};
