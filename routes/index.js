let express = require('express');
let router = express.Router();
let moment = require('moment');
let bulletin = require('../models/bulletin');
let suggestion = require('../models/suggestions');
let group = require('../models/group');
let isAuthed = require('../helpers/isauthed');

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
  if(req.isAuthenticated()) return res.redirect('back');
  return res.render('login');
});

router.get('/sign-up', (req, res, next) => {
  if(req.isAuthenticated()) return res.redirect('back');
  return res.render('signup');
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

router.get('/suggest/view/:page?', isAuthed('can_create_battles'), (req, res, next) => {
  let page = req.params.page ? req.params.page : 1;
  suggestion.paginate({}, { page: page, limit: 10, sort: { _id: -1 } }, (err, result) => {
    if(err) {
      req.flash('info', 'error displaying suggestions');
      return res.redirect('back');
    }

    if(result.docs.length == 0) {
      let err = page == 1 ? `no results found` : `no results found on page ${page}`;
      req.flash('info', err);
      return res.redirect('back');
    }

    return res.render('suggestions/view', {
      count: result.docs.length,
      documents: result.docs,
      page: page,
      getTime: (t) => { return moment(t).format('Do MMM, h:mma'); }
    });
  });
});

router.get('/logout', canLogout, (req, res, next) => {
  req.logout();
  req.flash('info', 'logged out! bye bye');
  return res.redirect('/');
});

module.exports = router;
