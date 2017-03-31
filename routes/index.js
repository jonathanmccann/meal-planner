var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot" ];

  res.render('index', { title: 'Express', ingredients: ingredients });
});

router.post('/submit', function(req, res, next) {
	console.log(req.body);

	res.redirect('/');
});

module.exports = router;
