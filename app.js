const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('express-flash');
const MongoStore = require('connect-mongo')(session);
const helmet = require('helmet');
const minify = require('express-minify');
const minifyHTML = require('express-minify-html');
const compression = require('compression');
const config = require('./config.json');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth').default(passport);
const opsRouter = require('./routes/ops');
const battleRouter = require('./routes/battle');

const Invite = require('./models/invites');
const Group = require('./models/group');

require('./helpers/passport')(passport);

const app = express();

if (!config || !config.sessionsecret || config.sessionsecret.trim() === '' || !config.mongourl) {
  console.log('config.json is invalid, please refer to config.example.json.');
  process.exit(1);
}

mongoose.connect(config.mongourl, { useNewUrlParser: true });

// create initial invite valid for one use (first user)
Invite.findOne({ code: 'admin' }, (err, doc) => {
  if (!doc && !err) {
    console.log("Created initial invite ('admin').");
    new Invite({ code: 'admin', used: false, infinite: false }).save();
  }
});

// set initial group permissions
Group.findOne({ name: 'admin' }, (err, doc) => {
  if (!doc && !err) new Group({ name: 'admin', permissions: ['*'] }).save();
});

Group.findOne({ name: 'user' }, (err, doc) => {
  if (!doc && !err) {
    new Group({
      name: 'user',
      permissions:
    ['can_suggest_rules', 'can_view_battles', 'can_participate_battles', 'can_edit_profile', 'can_view_profiles'],
    }).save();
  }
});

Group.findOne({ name: 'banned' }, (err, doc) => {
  if (!doc && !err) new Group({ name: 'banned', permissions: [] }).save();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(minify());
app.use(minifyHTML({ override: true, htmlMinifier: { collapseWhitespace: false } }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    name: 'arena',
    secret: config.sessionsecret,
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      httpOnly: true,
      expires: 1000 * 60 * 60 * 24 * 30,
      secure: !(config.env !== undefined && config.env === 'dev'),
    },
  }),
);
app.use(compression());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/auth', authRouter);
app.use('/ops', opsRouter);
app.use('/battles', battleRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = config.env !== undefined && config.env === 'dev' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
