const express = require('express');

const router = express.Router();
const Battle = require('../models/battle');
const Group = require('../models/group');
const isAuthed = require('../helpers/isauthed');

router.get('/createsample', (req, res) => {
  const test = new Battle({
    name: 'synth battle 01',
    id: 'synth-bb-01', // probably generate these
    description: 'the first in a line of synth beatbattles',
    ruleset: ['only use the samples provided', 'bass must be a saw'],
    rulesetContributor: 'reid',
    expiry: new Date(),
    voteLength: new Date(),
    submissions: {},
    info: {
      /* samples if neccesary */
      sample: {
        file: true,
        path: 'url or path to file',
        text: 'sample',
      },
      /* disqualified users */
      dq: ['test'],
      /* hide usernames in vote/submissions */
      blindvote: true,
    },
  });
  test.save();
  res.redirect('back');
});

router.get('/create', isAuthed('can_create_battles'), (req, res) => res.render('battle/create', {}));

router.post('/create', isAuthed('can_create_battles'), (req, res) => {
  // remove this when done testing
  req.flash('info', JSON.stringify(req.body, null, 2));
  if (req.body.endTime_epoch < req.body.startTime_epoch) {
    req.flash('info', 'invalid start/end times');
    return res.redirect('back');
  }
  const newBattle = {
    name: req.body.name,
    id: encodeURI(req.body.name.split(' ').join('-').toLowerCase()), // maybe just uuid this
    description: req.body.desc,
    ruleset: req.body.ruleset,
    expiry: req.body.endTime_epoch,
    submissions: {},
    rulesetContributor: req.user.username, // for if someone suggests some rules and they get used
    info: { dq: [] }, // prob best to make it an array in the schema
  };

  if (req.body.blindvote) newBattle.info.blindvote = true;
  const test = new Battle(newBattle);
  console.log(test);
  return res.redirect('back');
});

router.get('/', isAuthed('can_view_battles'), (req, res) => {
  Battle.find({}, (_, doc) => {
    if (doc) {
      const ongoing = {};
      doc.forEach((battle) => {
        ongoing[battle.id] = battle.name;
      });
      Group.findOne({ name: req.user.group }, (__, group) => {
        if (!group) return res.redirect('back');
        return res.render('battle/index', {
          ongoing,
          permissions: group.permissions,
        });
      });
    }
  });
});

router.get('/:id', isAuthed('can_view_battles'), (req, res) => res.render('battle/active', {}));

module.exports = router;
