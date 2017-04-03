var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/add-category', function(req, res, next) {
  res.render('add_category', { title: "Add Category" });
});

router.post('/add-category', function(req, res, next) {
  connection.query('INSERT INTO Category SET ?', req.body, function(err, result) {
  	if (err) {
      throw err;
  	}
  	else {
      res.redirect('/add-category');
  	}
  })
});

module.exports = router;