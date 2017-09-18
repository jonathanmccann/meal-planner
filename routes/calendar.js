var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/calendar', function(req, res) {
  connection.query('SELECT * FROM Calendar WHERE ?', {userId: req.user.userId}, function(err, calendarRows) {
    if (err) {
      console.error(err);

      res.render('calendar', {
        errorMessage: "The calendar was unable to be successfully loaded.",
        title: "Calendar",
        user: req.user
      });
    }
    else {
			connection.query('SELECT * FROM Recipe WHERE ?', {userId: req.user.userId}, function (err, recipeRows) {
				if (err) {
					console.error(err);

					res.render('calendar', {
						errorMessage: "The calendar was unable to be successfully loaded.",
						title: "Calendar",
						user: req.user
					});
				}
				else {
					var calendarDayAndRecipeMap = {};
					var categoryRecipeMap = {};

					for (var i = 0; i < calendarRows.length; i++) {
						calendarDayAndRecipeMap[calendarRows[i].mealKey] = [calendarRows[i].recipeId, calendarRows[i].recipeName];
					}

					for (var i = 0; i < recipeRows.length; i++) {
						var categoryName = recipeRows[i].categoryName;

						if (!categoryRecipeMap[categoryName]) {
							categoryRecipeMap[categoryName] = [];
						}

						categoryRecipeMap[categoryName].push(recipeRows[i]);
					}

					res.render('calendar', {
						calendarDayAndRecipeMap: calendarDayAndRecipeMap,
						categoryRecipes: categoryRecipeMap,
						errorMessage: req.flash('errorMessage'),
						successMessage: req.flash('successMessage'),
						test: "test",
						title: "Calendar",
						user: req.user
					});
				}
			});
    }
  });
});

router.post('/calendar', function(req, res) {
	if (req.body.action === "Clear Calendar") {
		connection.query('DELETE FROM Calendar WHERE ?', {userId: req.user.userId}, function(err) {
			if (err) {
				console.error(err);

				req.flash('errorMessage', 'The calendar was unable to be saved.');

				res.redirect('/calendar');
			}
			else {
				req.flash('successMessage', 'The calendar was cleared successfully.');

				res.redirect('/calendar');
			}
		});
	}
	else {
		connection.query('DELETE FROM Calendar WHERE ?', {userId: req.user.userId}, function(err) {
			if (err) {
				console.error(err);

				req.flash('errorMessage', 'The calendar was unable to be saved.');

				res.redirect('/calendar');
			}
			else {
				var meals = [];

				for (var key in req.body) {
					var [recipeId, mealKey] = key.split('_');

					var meal = [req.user.userId, recipeId, req.body[key], mealKey];

					meals.push(meal);
				}

				if (meals.length) {
					connection.query('INSERT INTO Calendar (userId, recipeId, recipeName, mealKey) VALUES ?', [meals], function (err) {
						if (err) {
							console.error(err);

							req.flash('errorMessage', 'The calendar was unable to be saved.');
						}
						else {
							req.flash('successMessage', 'The calendar was saved successfully.');
						}

						res.redirect('/calendar');
					});
				}
				else {
					req.flash('successMessage', 'The calendar was saved successfully.');

					res.redirect('/calendar');
				}
			}
		});
	}
});

module.exports = router;