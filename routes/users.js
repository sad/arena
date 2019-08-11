let express = require('express');
let router = express.Router();
let user = require('../models/user');
let moment = require('moment');
let isAuthed = require('../helpers/isauthed');

router.get('/profile', (req, res, next) => {
  if(req.isAuthenticated()) return res.redirect('/profile/' + req.user.username);
  return res.redirect('/login');
});

router.get('/profile/:user', isAuthed('can_view_profiles'), (req, res, next) => {
  user.findOne({username: req.params.user}, (err, doc) => {
    if(err || !doc) return res.send('idk who that is');
    let joined = new moment(doc.data.joined).format("ddd Do MMM YYYY").toLowerCase();
    
    return res.render('profile/index', {
      title: `${req.params.user} | arena.tapes.ws`,
      currentUser: req.user.username,
      currentGroup: req.user.group,
      username: doc.username,
      group: doc.group,
      joined: joined,
      data: doc.data,
    });
  });
});

router.get('/profile/edit/:user', isAuthed('can_edit_profile'), (req, res, next) => {
  user.findOne({username: req.params.user}, (err, doc) => {
    if(err || !doc) return res.send('idk who that is');
    let joined = new moment(doc.data.joined).format("ddd Do MMM YYYY").toLowerCase();
    if(req.user.username != req.params.user /*&& req.user.group != "admin"*/) return res.redirect('/profile');
    return res.render('profile/edit', {
      title: `${req.params.user} | arena.tapes.ws`,
      currentUser: req.user.username,
      username: doc.username,
      group: req.session.group,
      joined: joined,
      data: doc.data
    });
  });
});

router.get('/profile/edit/:user/password', isAuthed('can_edit_profile'), (req, res, next) => {
  user.findOne({username: req.params.user}, (err, doc) => {
    if(err || !doc) return res.send('idk who that is');
    if(req.user.username != req.params.user) return res.redirect('/profile');
    return res.render('profile/edit-password', {
      title: `${req.params.user} | arena.tapes.ws`,
      username: doc.username
    });
  });
});

router.post('/profile/edit/:user/password', isAuthed('can_edit_profile'), (req, res, next) => {
  user.findOne({username: req.params.user}, (err, doc) => {
    if(err || !doc) return res.send('idk who that is');
    if(req.user.username != req.params.user) return res.redirect('/profile');
    //console.log(req.body);
    if(!req.body || !req.body.oldpw || !req.body.newpw) {
      req.flash('info', 'please fill out all fields');
      res.redirect('back');
    }

    if(req.body.newpw.length < 8) {
      req.flash('info', 'password must be at least 8 characters');
      res.redirect('back');
    }

    if("compare",doc.comparePassword(req.body.oldpw, doc.password)) {
      let newpass = doc.hashPassword(req.body.newpw);
      user.updateOne({username: req.params.user}, {$set: { password: newpass }}, (err, doc) => {
        if(err) {
          req.flash('info', 'there was an error updating your password');
          return res.redirect('back');
        }else {
          req.flash('info', 'password changed succesfully');
          res.redirect('/profile/' + req.params.user);
        }
      });
    }else {
      req.flash('info', 'current password is incorrect');
      return res.redirect('back');
    }
  });
});

router.post('/profile/edit/:user', isAuthed('can_edit_profile'), (req, res, next) => {
  if(req.user.username != req.params.user && req.user.group != "admin") return res.redirect('back');
  user.findOne({username: req.params.user}, (err, doc) => {
    if(err || !doc) return res.redirect('back');

    let socials, gear, hideStats;
    if(doc.data.socials) { socials = doc.data.socials; } else { socials = {}; }
    if(doc.data.gear) { gear = doc.data.gear} else { gear = ""; }

    if(req.body.scurl && req.body.scurl.trim() != "") {
      let url = req.body.scurl;
      if(req.body.scurl.startsWith("https") || req.body.scurl.startsWith("http://")) {
        url = url.replace("https://", "").replace("http://", "");
      }

      if(url.startsWith("soundcloud.com") && url != "soundcloud.com") {
        socials["fab fa-soundcloud"] = url;
      }
    }

    if(req.body.bcurl && req.body.bcurl.trim() != "") {
      let url = req.body.bcurl;
      if(req.body.bcurl.startsWith("https") || req.body.bcurl.startsWith("http://")) {
        url = url.replace("https://", "").replace("http://", "");
      }

      if(url.endsWith("bandcamp.com") && url != "bandcamp.com") {
        socials["fab fa-bandcamp"] = url;
      }
    }

    if(req.body.gear && req.body.gear.trim() != "") {
      gear = req.body.gear.trim();
    }

    if(req.body.hidestats != undefined && req.body.hidestats == 0) {
      hideStats = true;
    }else {
      hideStats = false;
    }
  
    user.updateOne({username: req.params.user}, {$set: { "data.socials": socials, "data.gear": gear, "data.hideStats": hideStats }}, (err, doc) => {
      req.flash('info', 'profile updated');
      res.redirect('/profile/' + req.params.user);
    });
  });
});

module.exports = router;
