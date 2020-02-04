const express = require('express');

const router = express.Router();
const Moment = require('moment');
const bulletin = require('../models/bulletin');
const Suggestion = require('../models/suggestions');
const Group = require('../models/group');
const isAuthed = require('../helpers/isauthed');

const canLogout = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.redirect('/login');
};

/* GET home page. */
router.get('/', (req, res) => {
  if (!req.isAuthenticated()) return res.render('index', { title: 'lol' });
  bulletin.findOne({}, {}, { sort: { created_at: -1 } }, (err, doc) => {
    const date = doc ? new Moment(doc.time).format('Do MMM YYYY').toLowerCase() : 'n/a';
    const announce = bulletin.find().sort({ _id: -1 }).limit(1);

    announce.findOne({}, (_, announcement) => {
      Group.findOne({ name: req.user.group }, (__, group) => res.render('index-authed', {
        username: req.user.username,
        group: req.user.group,
        bulletin: announcement || 'no bulletin set',
        permissions: group ? group.permissions : [''],
        date,
      }));
    });
  });
});

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('back');
  return res.render('login');
});

router.get('/sign-up', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('back');
  return res.render('signup');
});

router.get('/suggest', isAuthed('can_suggest_rules'), (req, res) => {
  res.render('suggestions/create');
});

router.post('/suggest', isAuthed('can_suggest_rules'), (req, res) => {
  if (req.body.data) {
    const newSuggestion = new Suggestion({
      username: req.user.username,
      time: +new Date(),
      data: {
        body: req.body.data,
      },
    });

    newSuggestion.save((err, doc) => {
      if (err) req.flash('info', err);
      if (doc) req.flash('info', 'your submission has been noted');
      return res.redirect('back');
    });
  }
});

router.get('/suggest/view/:page?', isAuthed('can_create_battles'), (req, res) => {
  const page = req.params.page ? req.params.page : 1;
  Suggestion.paginate({}, { page, limit: 10, sort: { _id: -1 } }, (err, result) => {
    if (err) {
      req.flash('info', 'error displaying suggestions');
      return res.redirect('back');
    }

    if (result.docs.length === 0) {
      const resultError = page === 1 ? 'no results found' : `no results found on page ${page}`;
      req.flash('info', resultError);
      return res.redirect('back');
    }

    return res.render('suggestions/view', {
      count: result.docs.length,
      documents: result.docs,
      page,
      getTime: (t) => Moment(t).format('Do MMM, h:mma'),
    });
  });
});

router.get('/logout', canLogout, (req, res) => {
  req.logout();
  req.flash('info', 'logged out! bye bye');
  return res.redirect('/');
});

module.exports = router;
