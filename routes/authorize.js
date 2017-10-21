var config = require('../config');
var connection = require('../connection');
var express = require('express');
var oauth = require('simple-oauth2');
var request = require('request');
var router = express.Router();
var wunderlist = require('./wunderlist');

const wunderlistCredentials = {
  client: {
    id: config.configuration.wunderlistClientId,
    secret: config.configuration.wunderlistClientSecret
  },
    auth: {
    tokenHost: 'https://www.wunderlist.com/oauth/authorize'
  }
};

const wunderlistOauth = oauth.create(wunderlistCredentials);

const wunderlistAuthorizationUri = wunderlistOauth.authorizationCode.authorizeURL({
  redirect_uri: config.configuration.domain + '/wunderlist',
  state: config.configuration.oauthState
});

router.get('/wunderlist', function(req, res) {
  var code = req.query.code;

  var state = req.query.state;

  if (state !== config.configuration.oauthState) {
    console.error("A Wunderlist response was attempted to be forged.");

    req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');

    return res.redirect('/my-account');
  }

  request({
    url: 'https://www.wunderlist.com/oauth/access_token',
    method: 'POST',
    form: {
      'client_id': config.configuration.wunderlistClientId,
      'client_secret': config.configuration.wunderlistClientSecret,
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
        connection.query('UPDATE User_ SET ? WHERE ?', [ {accessToken: accessToken, listId: listId}, {userId: req.user.userId} ], function(err) {
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

router.post('/wunderlist', function(req, res) {
  res.redirect(wunderlistAuthorizationUri);
});

module.exports = router;