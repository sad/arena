var express = require('express');
var router = express.Router();
var invites = require('../models/invites');
var helper = require('../helpers/ops');
var users = require('../models/user');
var bulletin = require('../models/bulletin');

let isAuthed = (req, res, next) => {
    if(req.isAuthenticated() && req.user.group == "admin") return next();
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
        let announce = new bulletin({ message: req.body.message, time: new Date() });
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
            return res.render('ops/user', {
                user: user,
                invite: invite
            });
        });
    });
});

router.get('/users/:user/badges', isAuthed, (req, res, next) => {
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.send("lol");
        return res.render('ops/badges', {
            user: user,
        });
    });
});

router.post('/users/:user/setgroup/', isAuthed, (req, res, next) => {
    let group = req.body.group;
    users.findOne({username: req.params.user}, (err, user) => {
        if(!user || err) return res.redirect('back');
        if(!["user", "mod", "admin"].includes(group)) return res.redirect('back');
        users.updateOne({username: req.params.user}, {$set: { group: group }}, (err, doc) => {
            if(err) console.log(err);
            return res.redirect('back');
        });
    });
});

module.exports = router;