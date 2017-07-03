var config = require('../config');
var express = require('express');
var request = require('request');
var router = express.Router();
var wunderlist = require('./wunderlist');

const credentials = {
  client: {
    id: config.configuration.wunderlistClientId,
    secret: config.configuration.wunderlistClientSecret
  },
    auth: {
    tokenHost: 'https://www.wunderlist.com/oauth/authorize'
  }
};

const oauth2 = require('simple-oauth2').create(credentials);

const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: config.configuration.domain + '/callback',
  state: config.configuration.wunderlistState
});

router.get('/callback', function(req, res) {
  var code = req.query.code;

  var state = req.query.state;

  if (state !== config.configuration.wunderlistState) {
    console.error("A Wunderlist response was attempted to be forged.");

    req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');

    return res.redirect('/wunderlist');
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

    wunderlist.addList(accessToken, function(listId, err) {
      if (err) {
        req.flash('errorMessage', 'Your accounts were unable to be linked at this time.');
    
        return res.redirect('/wunderlist');
      }
      else {
        req.flash('successMessage', 'Your accounts have been linked successfully.');
    
        return res.redirect('/wunderlist');
      }
    });
  });
});

router.get('/wunderlist', function(req, res) {
  res.render('wunderlist', {
    errorMessage: req.flash('errorMessage'),
    successMessage: req.flash('successMessage'),
    title: "Recipes",
    user: req.user
  });
});

router.post('/wunderlist', function(req, res) {
  res.redirect(authorizationUri);
});

module.exports = router;