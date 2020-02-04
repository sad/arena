const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

module.exports = (passport) => {
  passport.serializeUser((user, done) => { done(null, user); });
  passport.deserializeUser((user, done) => { done(null, user); });

  passport.use(new LocalStrategy((username, password, done) => {
    User.findOne({ username }, (err, doc) => {
      if (err) return done(err);
      if (!doc) return done(null, false);
      const isValid = doc.comparePassword(password, doc.password);

      if (isValid) {
        return done(null, {
          username: doc.username,
          password: doc.password,
          group: doc.group,
          data: doc.data,
        });
      }
      return done(null, null);
    });
  }));
};
