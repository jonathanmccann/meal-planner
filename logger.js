var winston = require('winston');

const level = process.env.LOG_LEVEL || 'debug';

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: level,
      showLevel: true,
      timestamp: function () {
        return (new Date());
      }
    })
  ]
});

module.exports = logger;