var async = require('async');
var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.post('/add-category', function(req, res) {
  var categoryName = req.body.name;

  async.waterfall([
    function getExistingCategory(callback) {
      connection.query('SELECT COUNT(*) as categoryCount FROM Category WHERE ? AND ?', [{name: categoryName}, {userId: req.user.userId}], function(err, rows) {
        if (err) {
          callback(err);
        }
        else if (rows[0].categoryCount > 0) {
          req.flash('errorMessage', 'There is already a category with this name.');

          req.flash('categoryName', categoryName);

          return res.redirect('/view-categories')
        }
        else {
          callback(err);
        }
      });
    },
    function addCategory(callback) {
      connection.query('INSERT INTO Category SET ?, ?', [ {name: categoryName}, {userId: req.user.userId} ], function(err) {
        callback(err);
      })
    }
  ], function(err) {
    if (err) {
      console.error(err);

      req.flash('errorMessage', 'The category was unable to be added.');

      res.redirect('/view-categories');
  	}
  	else {
  	  req.flash('successMessage', 'The category was added successfully.');

      res.redirect('/view-categories');
  	}
  });
});

router.get('/edit-category/:categoryId', function(req, res) {
  var errorMessage = req.flash('errorMessage');

  if (errorMessage && errorMessage.length) {
    res.render('edit_category', {
      categoryId: req.params.categoryId,
      errorMessage: errorMessage,
      name: req.flash('categoryName'),
      title: "Edit Category",
      user: req.user
    });
  }
  else {
    connection.query('SELECT name FROM Category WHERE ? AND ?', [{categoryId: req.params.categoryId}, {userId: req.user.userId}], function (err, rows) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The category was unable to be found.');

        res.redirect('/view-categories');
      }
      else {
        res.render('edit_category', {
          categoryId: req.params.categoryId,
          name: rows[0].name,
          title: "Edit Category",
          user: req.user
        });
      }
    });
  }
});

router.post('/edit-category', function(req, res) {
  if (req.body.action === "Edit Category") {
    var categoryName = req.body.name;

    connection.beginTransaction(function (err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The category was unable to be edited.');
        req.flash('categoryName', categoryName);

        return res.redirect('/edit-category/' + req.body.categoryId);
      }

      async.waterfall([
        function getExistingCategory(callback) {
          connection.query('SELECT COUNT(*) as categoryCount FROM Category WHERE ? AND ?', [{name: categoryName}, {userId: req.user.userId}], function (err, rows) {
            if (err) {
              callback(err);
            }
            else if (rows[0].categoryCount > 0) {
              req.flash('errorMessage', 'There is already a category with this name.');

              req.flash('categoryName', categoryName);

              return res.redirect('/edit-category/' + req.body.categoryId);
            }
            else {
              callback(err);
            }
          });
        },
        function updateCategory(callback) {
          connection.query('UPDATE Category SET ? WHERE ? AND ?', [{name: categoryName}, {categoryId: req.body.categoryId}, {userId: req.user.userId}], function (err) {
            callback(err);
          });
        },
        function updateRecipes(callback) {
          connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [{categoryName: categoryName}, {categoryId: req.body.categoryId}, {userId: req.user.userId}], function (err) {
            callback(err);
          });
        },
        function commitUpdates(callback) {
          connection.commit(function(err) {
            callback(err);
          })
        }
      ], function (err) {
        if (err) {
          console.error(err);

          connection.rollback();

          req.flash('errorMessage', 'The category was unable to be edited.');
          req.flash('categoryName', categoryName);

          res.redirect('/edit-category/' + req.body.categoryId);
        }
        else {
          req.flash('successMessage', 'The category was edited successfully.');

          res.redirect('/view-categories');
        }
      });
    });
  }
  else {
    connection.query('DELETE FROM Category WHERE ? AND ?', [ {categoryId: req.body.categoryId}, {userId: req.user.userId} ], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The category was unable to be deleted.');
  
        res.redirect('/view-categories');
      }
      else {
        connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [ {categoryId: 0, categoryName: "No Category"}, {categoryId: req.body.categoryId}, {userId: req.user.userId} ], function(err) {
          if (err) {
            console.error(err);

            req.flash('errorMessage', 'The category was unable to be deleted.');
      
            res.redirect('/view-categories');
          }
          else {
            req.flash('successMessage', 'The category was deleted successfully.');

            res.redirect('/view-categories');
          }
        });
      }
    });
  }
});

router.get('/view-categories', function(req, res) {
  connection.query('SELECT * FROM Category WHERE ? ORDER BY name', [ {userId: req.user.userId} ], function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_categories', {
        categories: rows,
        categoryName: req.flash('categoryName'),
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Categories",
        user: req.user
      });
    }
  });
});

module.exports = router;