const express = require('express');

const router = express.Router();
const invites = require('../models/invites');
const helper = require('../helpers/ops');
const users = require('../models/user');
const groups = require('../models/group');
const bulletin = require('../models/bulletin');
const permissions = require('../permissions.json');
const isAuthed = require('../helpers/isauthed');

// home
router.get('/', isAuthed('can_view_ops'), (req, res, next) => {
  users.find({}, (err, doc) => {
    require('child_process').exec('git show -s --format="%h|%B"', (err, stdout) => {
      const commit = err ? '' : stdout;
      helper.hasPermission(req.user, 'can_view_ops_stats').then((permission) => {
        res.render('ops/dashboard', {
          canViewStats: permission,
          userCount: doc.length,
          group: req.user.group,
          commit,
          uptime: helper.toHHMMSS(process.uptime()),
        });
      });
    });
  });
});

// sys
router.get('/sys', isAuthed('can_view_ops_sys'), (req, res, next) => {
  const announce = bulletin.find().sort({
    _id: -1,
  }).limit(1);
  announce.findOne({}, (err, doc) => {
    res.render('ops/sys', {
      bulletin: doc || '',
    });
  });
});

router.post('/sys/bulletin', isAuthed('can_change_bulletin'), (req, res, next) => {
  if (req.body.message) {
    const announce = new bulletin({
      message: req.body.message,
      time: +new Date(),
    });
    announce.save((err, result) => {
      if (err) req.flash(err);
      else console.log(result);
      return res.redirect('back');
    });
  }
});

// invites
router.get('/invites', isAuthed('can_view_ops_invites'), (req, res, next) => {
  invites.find({}, (err, doc) => {
    const available = [];
    const used = [];
    doc.forEach((doc) => {
      if (doc.used) used.push(`${doc.code} (used by <strong>${doc.usedBy}</strong>)`);
      else if (doc.infinite) available.push(`${doc.code} (<strong>infinite</strong>)`);
      else available.push(doc.code);
    });

    res.render('ops/invites', {
      available,
      used,
    });
  });
});

router.get('/invites/generate', isAuthed('can_create_invites'), (req, res, next) => {
  const makeid = helper.makeID;
  const code = `${makeid(5)}-${makeid(5)}`.toLowerCase();
  const invite = new invites({
    code,
    used: false,
  });
  invite.save((err, result) => {
    if (err) req.flash('info', 'error while creating invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/generate/:code', isAuthed('can_create_invites'), (req, res, next) => {
  const invite = new invites({
    code: req.params.code,
    used: false,
  });
  invite.save((err, result) => {
    if (err) req.flash('info', 'error while creating invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/delete/:code', isAuthed('can_delete_invites_all'), (req, res, next) => {
  invites.deleteOne({
    code: req.params.code,
  }, (err) => {
    if (err) req.flash('info', 'error while deleting invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/infinite/:code', isAuthed('can_create_invites_infinite'), (req, res, next) => {
  invites.findOne({
    code: req.params.code,
  }, (err, founddoc) => {
    invites.updateOne({
      code: req.params.code,
    }, {
      $set: {
        infinite: !founddoc.infinite,
      },
    }, (err, (doc) => {
      if (err) req.flash('info', 'error while editing invite');
      return res.redirect('/ops/invites');
    }));
  });
});

// users
router.get('/users', isAuthed('can_view_ops_users'), (req, res, next) => {
  users.find({}, (err, doc) => res.render('ops/users', {
    users: doc,
  }));
});


router.get('/users/:user', isAuthed('can_view_ops_users'), (req, res, next) => {
  users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) {
      req.flash('info', `couldn't get ${req.params.user}'s profile`);
      return res.redirect('back');
    }

    invites.findOne({
      usedBy: req.params.user,
    }, (err, invite) => {
      groups.find({}, (err, groups) => {
        const availableGroups = [];
        groups.forEach((group) => {
          if (group.name !== user.group) availableGroups.push(group.name);
        });
        return res.render('ops/user', {
          user,
          invite,
          groups: availableGroups,
        });
      });
    });
  });
});

router.get('/users/:user/badges', isAuthed('can_manage_badges'), (req, res, next) => {
  users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    return res.render('ops/badges', {
      user,
    });
  });
});

router.get('/users/:user/removebadge/:badge', isAuthed('can_manage_badges'), (req, res, next) => {
  users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (user.data.badges[unescape(req.params.badge)] !== undefined) {
      user.set(`data.badges.${unescape(req.params.badge)}`, undefined, {
        strict: false,
      });
      user.save((err, doc) => {
        if (err) req.flash('info', 'could not remove this badge');
        return res.redirect('back');
      });
    }
  });
});

router.post('/users/:user/addbadge/', isAuthed('can_manage_badges'), (req, res, next) => {
  users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (!req.body || !req.body.ico || !req.body.val) return res.redirect('back');
    user.set(`data.badges.${req.body.ico}`, req.body.val);
    user.save((err, doc) => {
      if (err) req.flash('info', 'could not add this badge');
      return res.redirect('back');
    });
  });
});

router.post('/users/:user/setgroup/', isAuthed('can_set_group'), (req, res, next) => {
  const { group } = req.body;
  users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (user.username == req.user.username) {
      req.flash('info', 'cannot change your own group.');
      return res.redirect('back');
    }

    groups.find({}, (err, groups) => {
      if (err) return res.redirect('back');
      if (!groups.map((g) => g.name).includes(group)) return res.redirect('back');
      users.updateOne({
        username: req.params.user,
      }, {
        $set: {
          group,
        },
      }, (err, doc) => {
        if (err) req.flash('info', 'error changing group');
        return res.redirect('back');
      });
    });
  });
});

// groups

router.get('/groups', isAuthed('can_set_group'), (req, res, next) => {
  groups.find({}, (err, doc) => {
    res.render('ops/groups', {
      groups: doc,
    });
  });
});

router.get('/groups/:group', isAuthed('can_set_group'), (req, res, next) => {
  groups.findOne({
    name: req.params.group,
  }, (err, doc) => {
    if (!doc || err) return res.redirect('back');
    res.render('ops/group', {
      group: doc,
      permNodes: permissions,
    });
  });
});

router.post('/groups/create', isAuthed('can_create_group'), (req, res, next) => {
  if (!req.body.name) res.redirect('back');

  groups.findOne({
    name: req.body.name,
  }, (err, group) => {
    if (group || err) {
      req.flash('info', 'a group with this name already exists');
      return res.redirect('back');
    }

    const newGroup = new groups({
      name: req.body.name,
      permissions: [],
      nondefault: true,
    });
    newGroup.save((err, group) => {
      if (err) req.flash('info', 'error creating group');
      return res.redirect('back');
    });
  });
});

router.post('/groups/:group', isAuthed('can_set_group'), (req, res, next) => {
  const allPermNodes = Object.keys(permissions);
  const permNodes = Object.keys(req.body).filter((a) => allPermNodes.includes(a));

  groups.findOne({
    name: req.params.group,
  }, (err, group) => {
    if (!group || err) return res.redirect('back');
    if (group.permissions.includes('*')) {
      req.flash('info', 'cannot edit permissions of groups who have a wildcard permission set'); // might change this later or not idk
      return res.redirect('back');
    }

    groups.updateOne({
      name: req.params.group,
    }, {
      $set: {
        permissions: permNodes,
      },
    }, (err, doc) => {
      if (err) req.flash('info', 'error changing group permsisions');
      else req.flash('info', 'group updated');
      return res.redirect('back');
    });
  });
});

router.post('/groups/:group/delete', isAuthed('can_delete_group'), (req, res, next) => {
  groups.findOne({
    name: req.params.group,
  }, (err, group) => {
    if (!group || err) return res.redirect('back');
    if (!group.nondefault) {
      req.flash('info', 'cannot delete default groups');
      return res.redirect('back');
    }

    groups.remove({
      name: req.params.group,
    }, (err, doc) => {
      if (err) req.flash('info', 'error deleting group');

      users.update({
        group: req.params.group,
      }, {
        $set: {
          group: 'user',
        },
      }, (err, doc) => {
        if (err) req.flash('info', 'error reverting members of group to user');
        return res.redirect('..');
      });
    });
  });
});

module.exports = router;
