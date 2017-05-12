var express = require('express');
var router = express.Router();

router.get('/calendar', function(req, res) {
  res.render('calendar');
});

router.post('/calendar', function(req, res) {
  console.log(req.body);

  res.redirect('/calendar');
});

module.exports = router;