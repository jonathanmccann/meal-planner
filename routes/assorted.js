var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.get('/add-assorted', function(req, res) {
  res.render('add_assorted', { title: "Add Assorted Item" });
});

router.post('/add-assorted', function(req, res) {
  connection.query('INSERT INTO Assorted SET ?', req.body, function(err) {
  	if (err) {
      throw err;
  	}
  	else {
      res.redirect('/view-assorted');
  	}
  })
});

router.get('/edit-assorted/:assortedId', function(req, res) {
  connection.query('SELECT * FROM Assorted WHERE assortedId = ?', req.params.assortedId, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('edit_assorted', { assortedId: req.params.assortedId, itemName: rows[0].itemName, title: "Edit Assorted Item" });
    }
  });
});

router.post('/edit-assorted', function(req, res) {
  if (req.body.action === "Edit Assorted Item") {
    connection.query('UPDATE Assorted SET ? WHERE ?', [ {itemName: req.body.itemName}, {assortedId: req.body.assortedId} ], function(err) {
      if (err) {
        throw err;
      }
    });
  }
  else {
    connection.query('DELETE FROM Assorted WHERE assortedId = ?', req.body.assortedId, function(err) {
      if (err) {
        throw err;
      }
    });
  }

  res.redirect('/view-assorted');
});

router.get('/view-assorted', function(req, res) {
  connection.query('SELECT * FROM Assorted ORDER BY itemName', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_assorted', { assortedItems: rows, title: "View Assorted Items" });
    }
  });
});

module.exports = router;