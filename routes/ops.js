const express = require('express');
const childProcess = require('child_process');

const router = express.Router();
const helper = require('../helpers/ops');
const Users = require('../models/user');
const Groups = require('../models/group');
const Bulletin = require('../models/bulletin');
const Invites = require('../models/invites');
const permissions = require('../permissions.json');
const isAuthed = require('../helpers/isauthed');

// home
router.get('/', isAuthed('can_view_ops'), (req, res) => {
  Users.find({}, (err, doc) => {
    childProcess.exec('git show -s --format="%h|%B"', (cErr, stdout) => {
      const commit = cErr ? '' : stdout;
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
router.get('/sys', isAuthed('can_view_ops_sys'), (req, res) => {
  const announce = Bulletin.find().sort({
    _id: -1,
  }).limit(1);
  announce.findOne({}, (err, doc) => {
    res.render('ops/sys', {
      bulletin: doc || '',
    });
  });
});

router.post('/sys/bulletin', isAuthed('can_change_bulletin'), (req, res) => {
  if (req.body.message) {
    const announce = new Bulletin({
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
router.get('/invites', isAuthed('can_view_ops_invites'), (req, res) => {
  Invites.find({}, (err, doc) => {
    const available = [];
    const used = [];
    doc.forEach((inv) => {
      if (inv.used) used.push(`${inv.code} (used by <strong>${inv.usedBy}</strong>)`);
      else if (inv.infinite) available.push(`${inv.code} (<strong>infinite</strong>)`);
      else available.push(inv.code);
    });

    res.render('ops/invites', {
      available,
      used,
    });
  });
});

router.get('/invites/generate', isAuthed('can_create_invites'), (req, res) => {
  const makeid = helper.makeID;
  const code = `${makeid(5)}-${makeid(5)}`.toLowerCase();
  const invite = new Invites({
    code,
    used: false,
  });
  invite.save((err) => {
    if (err) req.flash('info', 'error while creating invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/generate/:code', isAuthed('can_create_invites'), (req, res) => {
  const invite = new Invites({
    code: req.params.code,
    used: false,
  });
  invite.save((err) => {
    if (err) req.flash('info', 'error while creating invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/delete/:code', isAuthed('can_delete_invites_all'), (req, res) => {
  Invites.deleteOne({
    code: req.params.code,
  }, (err) => {
    if (err) req.flash('info', 'error while deleting invite');
    return res.redirect('/ops/invites');
  });
});

router.get('/invites/infinite/:code', isAuthed('can_create_invites_infinite'), (req, res) => {
  Invites.findOne({
    code: req.params.code,
  }, (err, founddoc) => {
    Invites.updateOne({
      code: req.params.code,
    }, {
      $set: {
        infinite: !founddoc.infinite,
      },
    }, (err, () => {
      if (err) req.flash('info', 'error while editing invite');
      return res.redirect('/ops/invites');
    }));
  });
});

// users
router.get('/users', isAuthed('can_view_ops_users'), (req, res) => {
  Users.find({}, (err, doc) => res.render('ops/users', {
    users: doc,
  }));
});


router.get('/users/:user', isAuthed('can_view_ops_users'), (req, res) => {
  Users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) {
      req.flash('info', `couldn't get ${req.params.user}'s profile`);
      return res.redirect('back');
    }

    Invites.findOne({
      usedBy: req.params.user,
    }, (invErr, invite) => {
      Groups.find({}, (groupErr, groups) => {
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

router.get('/users/:user/badges', isAuthed('can_manage_badges'), (req, res) => {
  Users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    return res.render('ops/badges', {
      user,
    });
  });
});

router.get('/users/:user/removebadge/:badge', isAuthed('can_manage_badges'), (req, res) => {
  Users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (user.data.badges[unescape(req.params.badge)] !== undefined) {
      user.set(`data.badges.${unescape(req.params.badge)}`, undefined, {
        strict: false,
      });
      user.save((saveErr) => {
        if (saveErr) req.flash('info', 'could not remove this badge');
        return res.redirect('back');
      });
    }
  });
});

router.post('/users/:user/addbadge/', isAuthed('can_manage_badges'), (req, res) => {
  Users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (!req.body || !req.body.ico || !req.body.val) return res.redirect('back');
    user.set(`data.badges.${req.body.ico}`, req.body.val);
    user.save((userErr) => {
      if (userErr) req.flash('info', 'could not add this badge');
      return res.redirect('back');
    });
  });
});

router.post('/users/:user/setgroup/', isAuthed('can_set_group'), (req, res) => {
  const { group } = req.body;
  Users.findOne({
    username: req.params.user,
  }, (err, user) => {
    if (!user || err) return res.redirect('back');
    if (user.username === req.user.username) {
      req.flash('info', 'cannot change your own group.');
      return res.redirect('back');
    }

    Groups.find({}, (groupErr, groups) => {
      if (groupErr) return res.redirect('back');
      if (!groups.map((g) => g.name).includes(group)) return res.redirect('back');
      Users.updateOne({
        username: req.params.user,
      }, {
        $set: {
          group,
        },
      }, (setErr) => {
        if (setErr) req.flash('info', 'error changing group');
        return res.redirect('back');
      });
    });
  });
});

// groups

router.get('/groups', isAuthed('can_set_group'), (req, res) => {
  Groups.find({}, (err, doc) => {
    res.render('ops/groups', {
      groups: doc,
    });
  });
});

router.get('/groups/:group', isAuthed('can_set_group'), (req, res) => {
  Groups.findOne({
    name: req.params.group,
  }, (err, doc) => {
    if (!doc || err) return res.redirect('back');
    res.render('ops/group', {
      group: doc,
      permNodes: permissions,
    });
  });
});

router.post('/groups/create', isAuthed('can_create_group'), (req, res) => {
  if (!req.body.name) res.redirect('back');

  Groups.findOne({
    name: req.body.name,
  }, (err, group) => {
    if (group || err) {
      req.flash('info', 'a group with this name already exists');
      return res.redirect('back');
    }

    const newGroup = new Groups({
      name: req.body.name,
      permissions: [],
      nondefault: true,
    });
    newGroup.save((setErr) => {
      if (setErr) req.flash('info', 'error creating group');
      return res.redirect('back');
    });
  });
});

router.post('/groups/:group', isAuthed('can_set_group'), (req, res) => {
  const allPermNodes = Object.keys(permissions);
  const permNodes = Object.keys(req.body).filter((a) => allPermNodes.includes(a));

  Groups.findOne({
    name: req.params.group,
  }, (err, group) => {
    if (!group || err) return res.redirect('back');
    if (group.permissions.includes('*')) {
      req.flash('info', 'cannot edit permissions of groups who have a wildcard permission set'); // might change this later or not idk
      return res.redirect('back');
    }

    Groups.updateOne({
      name: req.params.group,
    }, {
      $set: {
        permissions: permNodes,
      },
    }, (updateErr) => {
      if (updateErr) req.flash('info', 'error changing group permsisions');
      else req.flash('info', 'group updated');
      return res.redirect('back');
    });
  });
});

router.post('/groups/:group/delete', isAuthed('can_delete_group'), (req, res) => {
  Groups.findOne({
    name: req.params.group,
  }, (err, group) => {
    if (!group || err) return res.redirect('back');
    if (!group.nondefault) {
      req.flash('info', 'cannot delete default groups');
      return res.redirect('back');
    }

    Groups.remove({
      name: req.params.group,
    }, (delErr) => {
      if (delErr) req.flash('info', 'error deleting group');

      Users.update({
        group: req.params.group,
      }, {
        $set: {
          group: 'user',
        },
      }, (revErr) => {
        if (revErr) req.flash('info', 'error reverting members of group to user');
        return res.redirect('..');
      });
    });
  });
});

module.exports = router;
