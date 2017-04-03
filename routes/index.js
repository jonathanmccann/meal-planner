var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config');

var connection = mysql.createConnection({
  host     : config.configuration.host,
  user     : config.configuration.user,
  password : config.configuration.password,
  database : config.configuration.database
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot", "Can of Soup" ];

  connection.query('SELECT name FROM Recipe WHERE recipeId = 1', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('index', { title: rows[0].name, ingredients: ingredients });
    }
  });
});

router.get('/add-recipe', function(req, res, next) {
  var ingredients = [ "tomato", "onion", "carrot", "Can of Soup" ];

  res.render('add_recipe');
});

router.post('/add-recipe', function(req, res, next) {
  var name = req.body.name;

  var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

  connection.query('INSERT INTO Recipe(name, ingredients) VALUES(?, ?)', [name, ingredients], function(err, result) {
  	if (err) {
      throw err;
  	}
  	else {
      res.redirect('/add-recipe');
  	}
  })
});

router.get('/view-recipes', function(req, res, next) {
  connection.query('SELECT * FROM Recipe', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_recipes', { recipes: rows });
    }
  });
});

router.post('/submit', function(req, res, next) {
  for (var name in req.body) {
    console.log("Name = " + name);
  }

  res.redirect('/');
});

module.exports = router;
