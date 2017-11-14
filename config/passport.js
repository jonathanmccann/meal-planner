var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var connection = require('../connection');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('../logger');

var emailAddressRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$");

const trialPeriodsDays = 14;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      async.waterfall([
        function fetchExistingUser(callback) {
          connection.query('SELECT * FROM User_ WHERE emailAddress = ?', [emailAddress], function(err, rows) {
            if (rows.length) {
              return done(null, false, req.flash('errorMessage', 'That email address is already taken.'));
            }
            else {
              callback(err);
            }
          });
        },
        function validateUser(callback) {
          if (!emailAddress || !password || !emailAddressRegex.test(emailAddress)) {
            return done(null, false, req.flash('errorMessage', 'Please enter a valid email address and password.'));
          }
          else {
            callback();
          }
        },
        function addUser(callback) {
          var user = {
            emailAddress: emailAddress,
            password: password
          };

          connection.query('INSERT INTO User_ (emailAddress, password) VALUES (?, ?)', [emailAddress, bcrypt.hashSync(password)], function(err, rows) {
            if (err) {
              callback(err);
            }
            else {
              user.userId = rows.insertId;

              callback(err, user);
            }
          })
        },
        function addUserToStripe(user, callback) {
          stripe.customers.create({
            email: user.emailAddress
          }).then(function(customer) {
            return stripe.subscriptions.create({
              customer: customer.id,
              items: [
                {
                  plan: "quick-meal-planner"
                }
              ],
              trial_period_days: trialPeriodsDays
            })
          }).then(function(subscription) {
            connection.query('UPDATE User_ SET ? WHERE ?', [{customerId: subscription.customer, subscriptionId: subscription.id}, {userId: user.userId}], function(err) {
              if (err) {
                callback(err);
              }
              else {
                callback(err, user);
              }
            });
          }).catch(function(err) {
            callback(err)
          });
        }
      ], function(err, user) {
        if (err) {
          logger.error("Unable to create new account for {emailAddress = %s}", emailAddress);
          logger.error(err);

          return done(err);
        }
        else {
          return done(null, user, req.flash('successMessage', 'You account has been successfully created. Start by adding some recipes and planning your week on the calendar.'));
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
          logger.error("Unable to retrieve user for {emailAddress = %s}", emailAddress);
          logger.error(err);

          return done(err);
        }
        else if (!rows.length || !bcrypt.compareSync(password, rows[0].password)) {
          return done(null, false, req.flash('errorMessage', 'Unable to login'));
        }
        else {
          var user = rows[0];

          stripe.subscriptions.retrieve(
            user.subscriptionId
          ).then(function(subscription) {
            var subscriptionStatus = subscription.status;

            if ((subscription.cancel_at_period_end && (subscriptionStatus !== "canceled")) || (subscriptionStatus === "active")) {
              connection.query('UPDATE User_ SET ? WHERE ?', [{subscriptionStatus: 1}, {userId: user.userId}], function(err, rows) {
                if (err) {
                  logger.error("Unable to log in due to inability to update user's subscription to active for {userId = %s}", user.userId);
                  logger.error(err);

                  return done(err);
                }
                else {
                  user.subscriptionStatus = 1;

                  return done(null, user);
                }
              });
            }
            else if (subscriptionStatus === "trialing") {
              connection.query('UPDATE User_ SET ? WHERE ?', [{subscriptionStatus: 2}, {userId: user.userId}], function(err) {
                if (err) {
                  logger.error("Unable to log in due to inability to update user's subscription to trialing for {userId = %s}", user.userId);
                  logger.error(err);

                  return done(err);
                }
                else {
                  user.subscriptionStatus = 2;

                  return done(null, user);
                }
              });
            }
            else {
              connection.query('UPDATE User_ SET ? WHERE ?', [{subscriptionStatus: 0}, {userId: user.userId}], function(err, rows) {
                if (err) {
                  logger.error("Unable to log in due to inability to update user's subscription to cancelled for {userId = %s}", user.userId);
                  logger.error(err);

                  return done(err);
                }
                else {
                  user.subscriptionStatus = 0;

                  return done(null, user);
                }
              });
            }
          }).catch(function(err) {
            logger.error("Unable to log in due to Stripe error for {userId = %s}", user.userId);
            logger.error(err);

            return done(err);
          });
        }
      })
    })
  );
};