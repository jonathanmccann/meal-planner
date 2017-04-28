var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.post('/add-category', function(req, res) {
  connection.query('INSERT INTO Category SET ?', req.body, function(err) {
  	if (err) {
      throw err;
  	}
  	else {
      res.redirect('/view-categories');
  	}
  })
});

router.get('/edit-category/:categoryId', function(req, res) {
  connection.query('SELECT * FROM Category WHERE categoryId = ?', req.params.categoryId, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('edit_category', { categoryId: req.params.categoryId, name: rows[0].name, title: "Edit Category" });
    }
  });
});

router.post('/edit-category', function(req, res) {
  if (req.body.action === "Edit Category") {
    connection.query('UPDATE Category SET ? WHERE ?', [ {name: req.body.name}, {categoryId: req.body.categoryId} ], function(err) {
      if (err) {
        throw err;
      }
    });

    connection.query('UPDATE Recipe SET ? WHERE ?', [ {categoryName: req.body.name}, {categoryId: req.body.categoryId} ], function(err) {
      if (err) {
        throw err;
      }
    });
  }
  else {
    connection.query('DELETE FROM Category WHERE categoryId = ?', req.body.categoryId, function(err) {
      if (err) {
        throw err;
      }
    });

    connection.query('UPDATE Recipe SET ? WHERE ?', [ {categoryId: 0, categoryName: "No Category"}, {categoryId: req.body.categoryId} ], function(err) {
      if (err) {
        throw err;
      }
    });
  }

  res.redirect('/view-categories');
});

router.get('/view-categories', function(req, res) {
  connection.query('SELECT * FROM Category ORDER BY name', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_categories', { categories: rows, title: "Categories" });
    }
  });
});

module.exports = router;