var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.post('/add-category', function(req, res) {
  connection.query('INSERT INTO Category SET ?, ?', [ {name: req.body.name}, {userId: req.user.userId} ], function(err) {
  	if (err) {
      console.error(err);

      req.flash('errorMessage', 'The category was unable to be added.');

      res.redirect('/view-categories');
  	}
  	else {
  	  req.flash('successMessage', 'The category was added successfully.');

      res.redirect('/view-categories');
  	}
  })
});

router.get('/edit-category/:categoryId', function(req, res) {
  connection.query('SELECT * FROM Category WHERE ? AND ?', [ {categoryId: req.params.categoryId}, {userId: req.user.userId} ], function(err, rows) {
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
});

router.post('/edit-category', function(req, res) {
  if (req.body.action === "Edit Category") {
    connection.query('UPDATE Category SET ? WHERE ? AND ?', [ {name: req.body.name}, {categoryId: req.body.categoryId}, {userId: req.user.userId} ], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The category was unable to be edited.');
  
        res.redirect('/view-categories');
      }
      else {
        connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [ {categoryName: req.body.name}, {categoryId: req.body.categoryId}, {userId: req.user.userId} ], function(err) {
          if (err) {
            console.error(err);
    
            req.flash('errorMessage', 'The category was unable to be edited.');
      
            res.redirect('/view-categories');
          }
          else {
            req.flash('successMessage', 'The category was edited successfully.');

            res.redirect('/view-categories');
          }
        });
      }
    });
  }
  else {
    connection.query('DELETE FROM Category WHERE ? AND ?', [ {categoryId: req.params.categoryId}, {userId: req.user.userId} ], function(err) {
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
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Categories",
        user: req.user
      });
    }
  });
});

module.exports = router;