var config = require('../config');
var connection = require('../connection');
var express = require('express');
var http = require('http');
var request = require('request');
var router = express.Router();
var wunderlistSDK = require('wunderlist');
var wunderlistAPI = new wunderlistSDK({
  'accessToken': config.configuration.wunderlistAccessToken,
  'clientID': config.configuration.wunderlistClientId
});

router.get('/', function(req, res, next) {
  res.render('index', { title: "Meal Planner" });
});

router.post('/add-ingredients', function(req, res, next) {
  var ingredients = [];

  for (var recipe in req.body) {
    wunderlistAPI.http.tasks.create({
      'list_id': config.configuration.listId,
      'title': recipe
    }).fail(function (resp, code) {
      console.error("An error occured while adding tasks: " + resp);
    });
  }

  res.redirect('/');
});

router.get('/add-meals', function(req, res, next) {
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

      res.render('add_meals', { categoryRecipes: categoryRecipeMap, title: "Add Meals" });
    });
  });
});

router.post('/add-meals', function(req, res, next) {
  var recipeIds = [];

  for (var recipeId in req.body) {
    recipeIds.push(recipeId);
  }

  connection.query('SELECT * FROM Recipe WHERE recipeId IN (' + recipeIds.join() + ')', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('add_ingredients', { recipes: rows, title: "Add Ingredients" });
    }
  })
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
  getCategories(function(categoryRows) {
    connection.query('SELECT * FROM Recipe WHERE recipeId = ?', req.params.recipeId, function(err, rows) {
      if (err) {
        throw err;
      }
      else {
        res.render('edit_recipe', { recipeId: req.params.recipeId, name: rows[0].name, ingredients: rows[0].ingredients.replace(/,/g, "\r\n"), categoryName: rows[0].categoryName, categories: categoryRows, title: "Edit Recipe" });
      }
    });
  });
});

router.post('/edit-recipe', function(req, res, next) {
  var recipeName = req.body.name;

  var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

  var categoryName = req.body.categoryName;

  connection.query('UPDATE Recipe SET ? WHERE ?', [ {name: recipeName, ingredients: ingredients, categoryName: categoryName}, { recipeId: req.body.recipeId}], function(err, rows) {
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

function uniqueElements(value, index, self) {
  return self.indexOf(value) === index;
}

module.exports = router;