let express = require('express');
let router = express.Router();
let bulletin = require('../models/bulletin');
let moment = require('moment');
let suggestion = require('../models/suggestions');
let isAuthed = require('../helpers/isauthed');
let group = require('../models/group');

let canLogout = (req, res, next) => {
  if(req.isAuthenticated()) return next();
  return res.redirect('/login');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.isAuthenticated()) return res.render('index', { title: 'lol' });
  bulletin.findOne({}, {}, {sort: { 'created_at': -1 }}, (err, doc) => {
    let date = doc ? new moment(doc.time).format("Do MMM YYYY").toLowerCase() : "n/a",
        announce = bulletin.find().sort({ _id: -1 }).limit(1);

    announce.findOne({}, (err, doc) => {
      group.findOne({name: req.user.group}, (err, group) => {
        return res.render('index-authed', {
          username: req.user.username,
          group: req.user.group,
          bulletin: doc ? doc : "no bulletin set",
          permissions: group ? group.permissions : [""],
          date: date
        });
      })
    });
  });
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

router.get('/sign-up', (req, res, next) => {
  res.render('signup');
});

router.get('/suggest', isAuthed('can_suggest_rules'), (req, res, next) => {
  res.render('suggestions/create');
});

router.post('/suggest', isAuthed('can_suggest_rules'), (req, res, next) => {
  if(req.body.data) {
    let newSuggestion = new suggestion({
      username: req.user.username,
      time: +new Date(),
      data: {
        body: req.body.data
      }
    });

    newSuggestion.save((err, doc) => {
      if(err) req.flash('info', err);
      if(doc) req.flash('info', 'your submission has been noted');
      return res.redirect('back');
    });
  }
});

router.get('/logout', canLogout, (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
