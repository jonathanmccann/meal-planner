var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/my-account', function(req, res) {
  res.render('my_account', {
    errorMessage: req.flash('errorMessage'),
    infoMessage: req.flash('infoMessage'),
    successMessage: req.flash('successMessage'),
    title: "My Account",
    user: req.user
  });
});

router.post('/my-account', function(req, res) {
  var emailAddress = req.body.emailAddress;

  connection.query('UPDATE User_ SET ? WHERE ?', [{emailAddress: emailAddress}, {userId: req.user.userId}], function(err) {
  	if (err) {
      console.error(err);

      req.flash('errorMessage', 'Your email address was unable to be updated.');
  	}
  	else {
  	  req.flash('successMessage', 'Your email address was updated successfully.');
  	}

  	res.redirect('/my-account');
  })
});

module.exports = router;