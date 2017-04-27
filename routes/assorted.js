var connection = require('../connection');
var express = require('express');
var router = express.Router();
var wunderlist = require('./wunderlist');

router.get('/add-assorted', function(req, res) {
  res.render('add_assorted', {
    errorMessage: req.flash('errorMessage'),
    successMessage: req.flash('successMessage'),
    title: "Add Assorted Item"
  });
});

router.post('/add-assorted', function(req, res) {
  connection.query('INSERT INTO Assorted SET ?', req.body, function(err) {
    if (err) {
      console.error(err);

      req.flash('errorMessage', 'The assorted item was unable to be added.');

      res.redirect('/add-assorted');
    }
    else {
      req.flash('successMessage', 'The assorted item was added successfully.');

      res.redirect('/view-assorted');
    }
  })
});

router.get('/edit-assorted/:assortedId', function(req, res) {
  connection.query('SELECT * FROM Assorted WHERE assortedId = ?', req.params.assortedId, function(err, rows) {
    if (err || rows.length === 0) {
      console.error(err);

      req.flash('errorMessage', 'The assorted item was unable to be found.');

      res.redirect('/view-assorted');
    }
    else {
      res.render('edit_assorted', {
        assortedId: req.params.assortedId,
        itemName: rows[0].itemName,
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Edit Assorted Item"
      });
    }
  });
});

router.post('/edit-assorted', function(req, res) {
  if (req.body.action === "Edit Assorted Item") {
    connection.query('UPDATE Assorted SET ? WHERE ?', [ {itemName: req.body.itemName}, {assortedId: req.body.assortedId} ], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The assorted item was unable to be edited.');
  
        res.redirect('/edit-assorted/' + req.body.assortedId);
      }
      else {
        req.flash('successMessage', 'The assorted item was edited successfully.');

        res.redirect('/view-assorted');
      }
    });
  }
  else {
    connection.query('DELETE FROM Assorted WHERE assortedId = ?', req.body.assortedId, function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The assorted item was unable to be edited.');
  
        res.redirect('/edit-assorted/' + req.body.assortedId);
      }
      else {
        req.flash('successMessage', 'The assorted item was deleted successfully.');

        res.redirect('/view-assorted');
      }
    });
  }
});

router.get('/plan-assorted', function(req, res) {
  connection.query('SELECT * FROM Assorted ORDER BY itemName', function(err, rows) {
    if (err) {
      console.error(err);

      req.flash('errorMessage', 'Unable to plan assorted items at this time.');

      res.redirect('/view-assorted');
    }
    else {
      res.render('plan_assorted', {
        assortedItems: rows, title: "Plan Assorted Items",
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage')
      });
    }
  });
});

router.post('/plan-assorted', function(req, res) {
  for (var assorted in req.body) {
    wunderlist.addTask(assorted)
  }

  req.flash('successMessage', 'The assorted items were added to Wunderlist successfully.');

  res.redirect('/plan-assorted');
});

router.get('/view-assorted', function(req, res) {
  connection.query('SELECT * FROM Assorted ORDER BY itemName', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('view_assorted', {
        assortedItems: rows,
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "View Assorted Items"
      });
    }
  });
});

module.exports = router;