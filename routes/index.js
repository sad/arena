let express = require('express');
let router = express.Router();
let bulletin = require('../models/bulletin');
let moment = require('moment');
let isAuthed = require('../helpers/isauthed');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.isAuthenticated()) return res.render('index', { title: 'lol' });
  bulletin.findOne({}, {}, {sort: { 'created_at': -1 }}, (err, doc) => {
    let date = doc ? new moment(doc.time).format("Do MMM YYYY").toLowerCase() : "n/a",
        announce = bulletin.find().sort({ _id: -1 }).limit(1);

    announce.findOne({}, (err, doc) => {
      return res.render('index-authed', {
        username: req.user.username,
        group: req.user.group,
        bulletin: doc ? doc : "no bulletin set",
        date: date
      });
    });
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

router.get('/sign-up', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});

router.get('/suggest', isAuthed('can_suggest_rules'), (req, res, next) => {
  res.render('suggestions/create');
});

router.get('/logout', isAuthed, (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
