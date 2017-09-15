var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.post('/add-recipe', function(req, res) {
  var name = req.body.name;

  var ingredients = req.body.ingredients.trim().replace(/\r?\n|\r/g, ",");

  var category = req.body.category;

  var categoryId = 0;
  var categoryName = "No Category";

  if (category !== undefined) {
    category = category.split(",");

    categoryId = category[0];
    categoryName = category[1];
  }

  connection.query('INSERT INTO Recipe(name, ingredients, categoryId, categoryName, userId) VALUES(?, ?, ?, ?, ?)', [name, ingredients, categoryId, categoryName, req.user.userId], function(err) {
  	if (err) {
      console.error(err);

      req.flash('errorMessage', 'The recipe was unable to be added.');
  	}
  	else {
  	  req.flash('successMessage', 'The recipe was added successfully.');
  	}

  	res.redirect('/view-recipes');
  })
});

router.get('/edit-recipe/:recipeId', function(req, res) {
  getCategories(req.user.userId, function(categoryRows) {
    connection.query('SELECT * FROM Recipe WHERE ? AND ?', [ {recipeId: req.params.recipeId}, {userId: req.user.userId} ], function(err, rows) {
      if (err || rows.length === 0) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be found.');

        res.redirect('/view-recipes');
      }
      else {
        res.render('edit_recipe', {
          categoryId: rows[0].categoryId,
          categories: categoryRows,
          ingredients: rows[0].ingredients.replace(/,/g, "\r\n"),
          name: rows[0].name,
          recipeId: req.params.recipeId,
          title: "Edit Recipe",
          user: req.user
        });
      }
    });
  });
});

router.post('/edit-recipe', function(req, res) {
  if (req.body.action === "Edit Recipe") {
    var recipeName = req.body.name;

    var ingredients = req.body.ingredients.trim().replace(/\r?\n|\r/g, ",");

    var category = req.body.category;

    var categoryId = 0;
    var categoryName = "No Category";
  
    if (category !== undefined) {
      category = category.split(",");
  
      categoryId = category[0];
      categoryName = category[1];
    }

    connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [ {name: recipeName, ingredients: ingredients, categoryId: categoryId, categoryName: categoryName}, { recipeId: req.body.recipeId}, {userId: req.user.userId}], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be edited.');
      }
      else {
        req.flash('successMessage', 'The recipe was edited successfully.');
      }

      res.redirect('/view-recipes');
    });
  }
  else {
    connection.query('DELETE FROM Recipe WHERE ? AND ?', [ {recipeId: req.body.recipeId}, {userId: req.user.userId} ], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be deleted.');
      }
      else {
        req.flash('successMessage', 'The recipe was deleted successfully.');
      }

      res.redirect('/view-recipes');
    });
  }
});

router.get('/view-recipes', function(req, res) {
  var categoryRecipeMap = {};

  getCategories(req.user.userId, function(categoryRows) {
    getRecipes(req.user.userId, function(recipeRows) {
      if (recipeRows.length === 0) {
        res.render('view_recipes', {
          categories: categoryRows,
          title: "Recipes",
          user: req.user
        });
      }
      else {
        for (var i = 0; i < recipeRows.length; i++) {
          var categoryName = recipeRows[i].categoryName;
  
          if (!categoryRecipeMap[categoryName]) {
            categoryRecipeMap[categoryName] = [];
          }
  
          categoryRecipeMap[categoryName].push(recipeRows[i]);
        }
  
        res.render('view_recipes', {
          categoryRecipes: categoryRecipeMap,
          categories: categoryRows,
          errorMessage: req.flash('errorMessage'),
          successMessage: req.flash('successMessage'),
          title: "Recipes",
          user: req.user
        });
      }
    });
  });
});

function getCategories(userId, callback) {
  connection.query('SELECT * FROM Category WHERE ? ORDER BY name', {userId: userId}, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

function getRecipes(userId, callback) {
  connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: userId}, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

module.exports = router;