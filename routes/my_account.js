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

module.exports = router;