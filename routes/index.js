var express = require('express');
var router = express.Router();
var bulletin = require('../models/bulletin');
var moment = require('moment');

let isAuthed = (req, res, next) => {
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
      return res.render('index-authed', {
        username: req.user.username,
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

router.get('/suggest', isAuthed, (req, res, next) => {
  res.render('suggestions/create');
});

router.get('/logout', isAuthed, (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
