var express = require('express');
var router = express.Router();
var mysql = require('mysql')

var connection = mysql.createConnection({
  host     : '',
  user     : '',
  password : '',
  database : ''
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot", "Can of Soup" ];

  res.render('index', { title: 'Express', ingredients: ingredients });
});

router.get('/add-recipe', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot", "Can of Soup" ];

  res.render('add_recipe');
});

router.post('/add-recipe', function(req, res, next) {
	var recipeName = req.body.recipeName;

	var recipeIngredients = req.body.recipeIngredients.split(/\n/);

	for (var i = 0; i < recipeIngredients.length; i++) {
		console.log(recipeIngredients[i]);
	}

	res.redirect('/');
});

router.post('/submit', function(req, res, next) {
	for (var name in req.body) {
		console.log("Name = " + name);
	}

	res.redirect('/');
});

module.exports = router;
