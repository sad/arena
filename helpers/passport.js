const localStrategy = require('passport-local').Strategy;
const user = require('../models/user');

module.exports = (passport) => {
    passport.serializeUser((user, done) => { done(null, user); });
    passport.deserializeUser((user, done) => { done(null, user); });

    passport.use(new localStrategy((username, password, done) => {
        user.findOne({username: username}, (err, doc) => {
            if(err) return done(err);
            if(!doc) return done(null, false);
            let isValid = doc.comparePassword(password, doc.password);

            if(isValid) {
                return done(null, {
                    username: doc.username,
                    password: doc.password,
                    group: doc.group,
                    data: doc.data
                });
            }else {
                return done(null, null);
            }
        });
    }));
}