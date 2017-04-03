var config = require('./config');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : config.configuration.host,
  user     : config.configuration.user,
  password : config.configuration.password,
  database : config.configuration.database
});

module.exports = connection