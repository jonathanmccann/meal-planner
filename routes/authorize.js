var connection = require('../connection');
var express = require('express');
var oauth = require('simple-oauth2');
var request = require('request');
var router = express.Router();
var todoist = require('./todoist');
var wunderlist = require('./wunderlist');

const todoistCredentials = {
  client: {
    id: process.env.TODOIST_CLIENT_ID,
    secret: process.env.TODOIST_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://todoist.com/oauth/authorize'
  }
};

const todoistOauth = oauth.create(todoistCredentials);

const todoistAuthorizationUri = todoistOauth.authorizationCode.authorizeURL({
  scope: "data:read_write,data:delete",
  state: process.env.OAUTH_STATE
});

const wunderlistCredentials = {
  client: {
    id: process.env.WUNDERLIST_CLIENT_ID,
    secret: process.env.WUNDERLIST_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://www.wunderlist.com/oauth/authorize'
  }
};

const wunderlistOauth = oauth.create(wunderlistCredentials);

const wunderlistAuthorizationUri = wunderlistOauth.authorizationCode.authorizeURL({
  redirect_uri: process.env.DOMAIN + '/wunderlist',
  state: process.env.OAUTH_STATE
});

router.get('/todoist', function(req, res) {
  var code = req.query.code;

  var state = req.query.state;

  if (state !== process.env.OAUTH_STATE) {
    console.error("A Wunderlist response was attempted to be forged.");

    req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');

    return res.redirect('/my-account');
  }

  request({
    url: 'https://todoist.com/oauth/access_token',
    method: 'POST',
    form: {
      'client_id': process.env.TODOIST_CLIENT_ID,
      'client_secret': process.env.TODOIST_CLIENT_SECRET,
      'code': code
    }
  }, function(err, todoistResponse) {
    var json = JSON.parse(todoistResponse.body);

    var accessToken = json.access_token;

    todoist.addList(accessToken, function(err, listId) {
      if (err) {
        req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');
    
        return res.redirect('/my-account');
      }
      else {
        connection.query('UPDATE User_ SET ? WHERE ?', [ {toDoProvider: "Todoist", accessToken: accessToken, listId: listId}, {userId: req.user.userId} ], function(err) {
          if (err) {
            console.error(err);
    
            req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');
          }
          else {
            req.flash('successMessage', 'Your accounts have been linked successfully.');
          }
    
          res.redirect('/my-account');
        });
      }
    });
  });
});

router.get('/wunderlist', function(req, res) {
  var code = req.query.code;

  var state = req.query.state;

  if (state !== process.env.OAUTH_STATE) {
    console.error("A Wunderlist response was attempted to be forged.");

    req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');

    return res.redirect('/my-account');
  }

  request({
    url: 'https://www.wunderlist.com/oauth/access_token',
    method: 'POST',
    form: {
      'client_id': process.env.WUNDERLIST_CLIENT_ID,
      'client_secret': process.env.WUNDERLIST_CLIENT_SECRET,
      'code': code
    }
  }, function(err, wunderlistResponse) {
    var json = JSON.parse(wunderlistResponse.body);

    var accessToken = json.access_token;

    wunderlist.addList(accessToken, function(err, listId) {
      if (err) {
        req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');
    
        return res.redirect('/my-account');
      }
      else {
        connection.query('UPDATE User_ SET ? WHERE ?', [ {toDoProvider: "Wunderlist", accessToken: accessToken, listId: listId}, {userId: req.user.userId} ], function(err) {
          if (err) {
            console.error(err);
    
            req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');
          }
          else {
            req.flash('successMessage', 'Your accounts have been linked successfully.');
          }
    
          res.redirect('/my-account');
        });
      }
    });
  });
});

router.post('/todoist', function(req, res) {
  res.redirect(todoistAuthorizationUri);
});

router.post('/wunderlist', function(req, res) {
  res.redirect(wunderlistAuthorizationUri);
});

module.exports = router;