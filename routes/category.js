var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/add-category', function(req, res, next) {
  res.render('add_category', { title: "Add Category" });
});

router.post('/add-category', function(req, res, next) {
  connection.query('INSERT INTO Category SET ?', req.body, function(err, result) {
  	if (err) {
      throw err;
  	}
  	else {
      res.redirect('/add-category');
  	}
  })
});

router.get('/edit-category/:categoryId', function(req, res, next) {
  connection.query('SELECT * FROM Category WHERE categoryId = ?', req.params.categoryId, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('edit_category', { categoryId: req.params.categoryId, name: rows[0].name, title: "Edit Category" });
    }
  });
});

router.post('/edit-category', function(req, res, next) {
  connection.query('UPDATE Category SET ? WHERE ?', [ {name: req.body.name}, {categoryId: req.body.categoryId} ], function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.redirect('/view-categories');
    }
  });
});

router.get('/view-categories', function(req, res, next) {
  connection.query('SELECT * FROM Category', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_categories', { categories: rows, title: "View Categories" });
    }
  });
});

module.exports = router;