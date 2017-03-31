var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot", "Can of Soup" ];

  res.render('index', { title: 'Express', ingredients: ingredients });
});

router.post('/submit', function(req, res, next) {
	for (var name in req.body) {
		console.log("Name = " + name);
	}

	res.redirect('/');
});

module.exports = router;
