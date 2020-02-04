const express = require('express');

const router = express.Router();
const User = require('../models/user');
const Invites = require('../models/invites');

module.exports = (passport) => {
  router.post('/signup', (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
    const { code } = req.body;
    const usernameRegex = /^[a-zA-Z0-9-_]+$/;

    if (!username || !password || !code) {
      req.flash('info', 'required fields not filled');
      return res.redirect('back');
    }

    if (username.length < 3 || username.length > 12) {
      req.flash('info', 'username must be between 3 and 12 characters');
    }

    if (username.search(usernameRegex) === -1) {
      req.flash('info', 'invalid characters in username');
    }

    if (password.length < 8) {
      req.flash('info', 'password must be at least 8 characters');
    }

    User.findOne({ username }, (error, user) => {
      if (error) return res.status(500).redirect('back');
      if (user) {
        req.flash('info', 'user already exists.');
        return res.redirect('back');
      }

      Invites.findOne({ code }, (err, invite) => {
        if (err || !invite || invite.used) {
          req.flash('info', ' invalid invite code ');
          return res.redirect('back');
        }

        if (!invite.infinite || invite.infinite === undefined) {
          Invites.updateOne({ code }, { $set: { used: true, usedBy: username } }, (err, () => {
            if (err) {
              req.flash('info', `error using invite ${code}`);
              return res.redirect('back');
            }
            return true;
          }));
        }

        const record = new User({
          username,
          group: 'user',
          data: {
            joined: +new Date(),
            badges: {
              'fas fa-cog': 'beta tester',
            },
            battles: {
              participated: 0,
              won: 0,
            },
          },
        });

        if (code === 'admin') {
          record.group = 'admin';
          record.data.badges['fas fa-code'] = 'administrator';
        }

        record.password = record.hashPassword(password);
        record.save((saveErr) => {
          if (saveErr) {
            req.flash('info', 'error creating account');
            return res.redirect('back');
          }
          req.flash('info', 'account created! please sign in');
          return res.redirect('/profile'); // redirect to /welcome maybe, redirecting back to / doesnt work and unaths
        });
        return true;
      });
      return true;
    });
    return true;
  });

  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if (err) return res.redirect('back');
      if (!user) {
        req.flash('info', 'invalid username or password');
        return res.redirect('back');
      }

      req.logIn(user, (error) => {
        if (error) {
          req.flash('info', 'error signing in');
          return res.redirect('back');
        }

        if (user.group === 'banned') {
          req.flash('info', 'your account has been disabled');
          req.logout();
          return res.redirect('back');
        }
        return res.redirect('/');
      });
      return true;
    })(req, res, next);
  });

  return router;
};
