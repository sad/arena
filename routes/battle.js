let express = require('express');
let router = express.Router();
let battle = require('../models/battle');
let isAuthed = require('../helpers/isauthed');

router.get('/createsample', (req, res, next) => {
    let test = new battle({
        name: "synth battle 01",
        id: "synth-bb-01", //probably generate these
        description: "the first in a line of synth beatbattles",
        ruleset: ["only use the samples provided", "bass must be a saw"],
        rulesetContributor: "reid",
        expiry: new Date(),
        voteLength: new Date(),
        submissions: {},
        info: {
            /* samples if neccesary */
            "sample": {
                "file": true,
                "path": "url or path to file",
                "text": "sample"
            },
            /* disqualified users */
            "dq": ["test"],
            /* hide usernames in vote/submissions */
            "blindvote": true
        }
    });
    test.save()
    res.redirect('back');
});

router.get('/create', isAuthed('can_create_battles'), (req, res, next) => {
    if(!req.user.group == "admin") return res.redirect('back');
    res.render('battle/battle-create', {

    });
});

router.get('/', isAuthed('can_view_battles'), (req, res, next) => {
    battle.find({}, (err, doc) => {
        if(err) console.log(err);
        if(doc) {
            let ongoing = {}, finished = {};
            doc.forEach((battle) => {
                ongoing[battle.id] = battle.name
            });

            res.render('battle/battles', {
                ongoing: ongoing
            });
        }
    });
});

router.get('/:id', isAuthed('can_view_battles'), (req, res, next) => {
    res.render('battle/battle-active', {
        
    });
});

module.exports = router;