var bcrypt = require('bcrypt-nodejs');
var connection = require('../connection');
var LocalStrategy = require('passport-local').Strategy;

var emailAddressRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$");

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.userId);
  });

  passport.deserializeUser(function(userId, done) {
    connection.query('SELECT * FROM User_ WHERE userId = ?', [userId], function (err, rows) {
      done(err, rows[0]);
    })
  });

  passport.use(
    'create-account',
    new LocalStrategy({
      usernameField: 'emailAddress',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, emailAddress, password, done) {
      connection.query('SELECT * FROM User_ WHERE emailAddress = ?', [emailAddress], function(err, rows) {
        if (err) {
          console.error(err);

          return done(err);
        }
        else if (rows.length) {
          return done(null, false, req.flash('errorMessage', 'That email address is already taken.'));
        }
        else if (!emailAddress || !password || !emailAddressRegex.test(emailAddress)) {
          return done(null, false, req.flash('errorMessage', 'Please enter a valid email address and password.'));
        }
        else {
          var user = {
            emailAddress: emailAddress,
            password: password
          };

          connection.query('INSERT INTO User_ (emailAddress, password) VALUES (?, ?)', [emailAddress, bcrypt.hashSync(password)], function(err, rows) {
            if (err) {
              return done(err);
            }
            else {
              user.userId = rows.insertId;

              return done(null, user, req.flash('successMessage', 'You account has been successfully created. Please connect with Wunderlist to start planning meals.'));
            }
          })
        }
      });
    })
  );

  passport.use(
    'log-in',
    new LocalStrategy({
      usernameField: 'emailAddress',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, emailAddress, password, done) {
      connection.query('SELECT * FROM User_ WHERE emailAddress = ?', [emailAddress], function(err, rows) {
        if (err) {
          console.error(err);

          return done(err);
        }
        else if (!rows.length || !bcrypt.compareSync(password, rows[0].password)) {
          return done(null, false, req.flash('errorMessage', 'Unable to login'));
        }
        else {
          return done(null, rows[0]);
        }
      })
    })
  );
};