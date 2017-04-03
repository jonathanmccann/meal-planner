var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: "Meal Planner" });
});

router.get('/add-recipe', function(req, res, next) {
  res.render('add_recipe', { title: "Add Recipe" });
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

router.get('/edit-recipe/:recipeId', function(req, res, next) {
  connection.query('SELECT * FROM Recipe WHERE recipeId = ?', req.params.recipeId, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('edit_recipe', { recipeId: req.params.recipeId, name: rows[0].name, ingredients: rows[0].ingredients.replace(/,/g, "\r\n"), title: "Edit Recipe" });
    }
  });
});

router.post('/edit-recipe', function(req, res, next) {
  var recipeName = req.body.name;

  var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

  connection.query('UPDATE Recipe SET ? WHERE ?', [ {name: recipeName, ingredients: ingredients}, { recipeId: req.body.recipeId}], function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.redirect('/view-recipes');
    }
  });
});

router.get('/view-recipes', function(req, res, next) {
  connection.query('SELECT * FROM Recipe', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_recipes', { recipes: rows, title: "View Recipes" });
    }
  });
});

module.exports = router;