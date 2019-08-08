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

        if(!username || !password || !code) return res.status(500).send("required fields not filled");

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
                        if(err) return res.status(500).send(err);
                    }));
                }

                let record = new user({ username: username, group: "user" });
                record.data = {
                    "joined": +new Date,
                    "badges": {
                        "fas fa-cog": "beta tester"
                    },
                    "battles": {
                        "participated": 0,
                        "won": 0
                    }
                }

                if(code == "admin") {
                    record.group = "admin"; //make first user admin
                    record.data.badges["fas fa-code"] = "administrator";
                }

                record.password = record.hashPassword(password);
                record.save((err, result) => {
                    if(err) return res.status(500).send(err);
                    req.flash('info', 'account created! please sign in');
                    res.redirect('/profile'); // redirect to /welcome maybe, redirecting back to / doesnt work and unaths
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
                if(err) return res.redirect('back');
                return res.redirect('/');
            })
        })(req, res, next);
    });

    return router;
};
