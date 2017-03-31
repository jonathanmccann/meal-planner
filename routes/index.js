var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var cars = [ "asdf", "toyota", "honda", "ford" ];

  res.render('index', { title: 'Express', carsList: cars });
});

module.exports = router;
