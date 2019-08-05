var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('express-flash');
var mongoStore = require('connect-mongo')(session);
var helmet = require('helmet');
var minify = require('express-minify');
var minifyHTML = require('express-minify-html');
var compression = require('compression');
var config = require('./config.json');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth')(passport);
var opsRouter = require('./routes/ops');
var battleRouter = require('./routes/battle');

var app = express();

if(!config || !config.sessionsecret || config.sessionsecret.trim() == "" ||!config.mongourl) {
  console.log("config.json is invalid, please refer to config.example.json.");
  process.exit(1);
}

mongoose.connect(config.mongourl, { useNewUrlParser: true });
require('./helpers/passport')(passport);

var invite = require('./models/invites');

//create initial invite valid for one use (first user)
invite.findOne({code: "admin"}, (err, doc) => {
  if(!doc && !err) new invite({code: "admin", used: false, infinite: false}).save();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(minify());
app.use(minifyHTML({ override: true, htmlMinifier: { collapseWhitespace: false } }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  name: "arena",
  secret: config.sessionsecret,
  saveUninitialized: false,
  resave: false,
  store: new mongoStore({ mongooseConnection: mongoose.connection }),
  cookie: {
    httpOnly: true,
    expires: 1000 * 60 * 60 * 24 * 30
    /*secure: true*/
  }
}));
app.use(compression());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/auth', authRouter);
app.use('/ops', opsRouter);
app.use('/battles', battleRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
