var express = require('express');
var router = express.Router();
var invites = require('../models/invites');
var helper = require('../helpers/ops');
var users = require('../models/user');
var groups = require('../models/group');
var bulletin = require('../models/bulletin');

let isAuthed = (req, res, next) => {
    if(req.isAuthenticated()) return next();
    return res.redirect("/profile")
}

// home
router.get('/', isAuthed, (req, res, next) => {
    users.find({}, (err, doc) => {
        require('child_process').exec('git show -s --format="%h|%B"', (err, stdout) => {
            let commit = err ? "" : stdout;
            res.render('ops/dashboard', {
                userCount: doc.length,
                group: req.user.group,
                commit: commit,
                uptime: helper.toHHMMSS(process.uptime())
            });
        });
    });
});

// sys
router.get('/sys', isAuthed, (req, res, next) => {
    let announce = bulletin.find().sort({ _id: -1 }).limit(1);
    announce.findOne({}, (err, doc) => {
        res.render('ops/sys', {
            bulletin: doc ? doc : ""
        });
    });
});

router.post('/sys/bulletin', isAuthed, (req, res, next) => {
    if(req.body.message) {
        let announce = new bulletin({ message: req.body.message, time: +new Date() });
        announce.save((err, result) => {
            if(err) req.flash(err);
            else console.log(result);
            return res.redirect('back');
        })
    }
});

// invites
router.get('/invites', isAuthed, (req, res, next) => {
    invites.find({}, (err, doc) => {
        let available = [], used = [];
        doc.forEach((doc) => {
            if(doc.used) used.push(`${doc.code} (used by <strong>${doc.usedBy}</strong>)`);
            else if(doc.infinite) available.push(`${doc.code} (<strong>infinite</strong>)`);
            else available.push(doc.code);
        });

        res.render('ops/invites', {
            available: available,
            used: used
        });
    });
});

router.get('/invites/generate', isAuthed, (req, res, next) => {
    let makeid = helper.makeID;
    let code = `${makeid(5)}-${makeid(5)}`.toLowerCase();
    let invite = new invites({code: code, used: false});
    invite.save((err, result) => {
        if(err) console.log(err);
        res.redirect('/ops/invites');
    });
});

router.get('/invites/generate/:code', isAuthed, (req, res, next) => {
    let invite = new invites({code: req.params.code, used: false});
    invite.save((err, result) => {
        if(err) console.log(err);
        res.redirect('/ops/invites');
    });
});

router.get('/invites/delete/:code', isAuthed, (req, res, next) => {
    invites.deleteOne({code: req.params.code}, (err) => {
        if(err) console.log(err);
        return res.redirect('/ops/invites');
    })
});

router.get('/invites/infinite/:code', isAuthed, (req, res, next) => {
    invites.findOne({code: req.params.code}, (err, founddoc) => {
        invites.updateOne({code: req.params.code}, {$set: { infinite: !founddoc.infinite }}, (err, doc => {
            if(err) return res.status(500).send(err);
            return res.redirect('/ops/invites');
        }));
    });
});

// users
router.get('/users', isAuthed, (req, res, next) => {
    users.find({}, (err, doc) => {
        res.render('ops/users', {
            users: doc
        });
    });
});


router.get('/users/:user', isAuthed, (req, res, next) => {
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.send("lol");
        invites.findOne({usedBy: req.params.user}, (err, invite) => {
            groups.find({}, (err, groups) => {
                let availableGroups = [];
                groups.forEach(group => { if(group.name != user.group) availableGroups.push(group.name); });
                return res.render('ops/user', {
                    user: user,
                    invite: invite,
                    groups: availableGroups
                });
            });
        });
    });
});

router.get('/users/:user/badges', isAuthed, (req, res, next) => {
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.redirect('back');
        return res.render('ops/badges', {
            user: user,
        });
    });
});

router.get('/users/:user/removebadge/:badge', isAuthed, (req, res, next) => {
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.redirect('back');
        if(user.data.badges[unescape(req.params.badge)] != undefined) {
            user.set(`data.badges.${unescape(req.params.badge)}`, undefined, { strict: false });
            user.save((err, doc) => {
                if(err) req.flash('info', 'could not remove this badge');
                return res.redirect('back');
            })
        }
    });
});

router.post('/users/:user/addbadge/', isAuthed, (req, res, next) => {
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.redirect('back');
        if(!req.body || !req.body.ico || !req.body.val) return res.redirect('back');
        user.set(`data.badges.${req.body.ico}`, req.body.val);
        user.save((err, doc) => {
            if(err) req.flash('info', 'could not add this badge');
            return res.redirect('back');
        });
    });
});

router.post('/users/:user/setgroup/', isAuthed, (req, res, next) => {
    let group = req.body.group;
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.redirect('back');
        if(user.username == req.user.username) {
            req.flash('info', 'cannot change your own group.');
            return res.redirect('back');
        }

        groups.find({}, (err, groups) => {
            if(err) return res.redirect('back');
            if(!groups.map(g => g.name).includes(group)) return res.redirect('back');
            users.updateOne({username: req.params.user}, {$set: { group: group }}, (err, doc) => {
                if(err) req.flash('info', 'error changing group');
                return res.redirect('back');
            });
        });
    });
});

// groups

router.get('/groups', isAuthed, (req, res, next) => {
    groups.find({}, (err, doc) => {
        res.render('ops/groups', {
            groups: doc
        });
    });
});

router.get('/groups/:group', isAuthed, (req, res, next) => {
    groups.findOne({name: req.params.group}, (err, doc) => {
        if(!doc || err) return res.redirect('back');
        res.render('ops/group', {
            group: doc,
            permNodes: ["can_suggest_rules","can_view_battles","can_participate_battles","can_edit_profile","can_view_profiles",
            "can_create_battles","can_view_ops","can_view_ops_battles","can_view_ops_invites","can_view_ops_users",
            "can_view_ops_sys","can_view_ops_stats","can_create_invites","can_manage_badges","can_set_group",
            "can_delete_invites_own","can_delete_invites_all","can_create_invites_infinite","can_change_bulletin"] // tba: probably move this to the config or db
        });
    });
});

router.post('/groups/:group', isAuthed, (req, res, next) => {
     let allPermNodes = ["can_suggest_rules","can_view_battles","can_participate_battles","can_edit_profile","can_view_profiles",
     "can_create_battles","can_view_ops","can_view_ops_battles","can_view_ops_invites","can_view_ops_users",
     "can_view_ops_sys","can_view_ops_stats","can_create_invites","can_manage_badges","can_set_group",  // need to put this somewhere in a config on god
     "can_delete_invites_own","can_delete_invites_all","can_create_invites_infinite","can_change_bulletin"], permNodes = Object.keys(req.body).filter(a => allPermNodes.includes(a));
    // console.log(permNodes);
     groups.findOne({name: req.params.group}, (err, group) => {
        if(!group || err) return res.redirect('back');
        if(group.permissions.includes("*"))  {
            req.flash('info', 'cannot edit permissions of groups who have a wildcard permission set'); // might change this later or not idk
            return res.redirect('back');
        }

            groups.updateOne({name: req.params.group}, {$set: { permissions: permNodes }}, (err, doc) => {
                if(err) req.flash('info', 'error changing group permsisions');
                return res.redirect('back');
            });
        
    }); 
});

module.exports = router;