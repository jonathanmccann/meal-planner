var fs = require('fs');
var configPath = './config.json';

var parsedConfig = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));

exports.configuration = parsedConfig;