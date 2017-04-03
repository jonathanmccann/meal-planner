var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: "Meal Planner" });
});

router.get('/add-recipe', function(req, res, next) {
  connection.query('SELECT * FROM Category', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('add_recipe', { title: "Add Recipe", categories: rows });
    }
  })
});

router.post('/add-recipe', function(req, res, next) {
  var name = req.body.name;

  var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

  var categoryName = req.body.categoryName;

  connection.query('INSERT INTO Recipe(name, ingredients, categoryName) VALUES(?, ?, ?)', [name, ingredients, categoryName], function(err, result) {
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
  var categoryRecipeMap = new Object();

  getCategories(function(categoryRows){
    getRecipes(function(recipeRows) {
      if (recipeRows.length == 0) {
        res.render('view_recipes', { title: "View Recipes" });
      }

      for (var i = 0; i < recipeRows.length; i++) {
        var categoryName = recipeRows[i].categoryName;

        if (!categoryRecipeMap[categoryName]) {
          categoryRecipeMap[categoryName] = [];
        }

        categoryRecipeMap[categoryName].push(recipeRows[i]);
      }

      res.render('view_recipes', { categoryRecipes: categoryRecipeMap, title: "View Recipes" });
    });
  });  
});

function getCategories(callback) {
  connection.query('SELECT * FROM Category', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

function getRecipes(callback) {
  connection.query('SELECT * FROM Recipe', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

module.exports = router;