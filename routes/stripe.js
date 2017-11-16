var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();
var sendgrid = require('@sendgrid/mail');

const eventType = "customer.subscription.trial_will_end";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/stripe', function(req, res) {
  if (req.body.type && (req.body.type === eventType)) {
    var customerId = req.body.data.object.customer;

    connection.query('SELECT emailAddress FROM User_ where ?', {customerId: customerId}, function(err, rows) {
      if (err) {
        logger.error("Unable to fetch emailAddress for Stripe trial ending webhook for {customerId = %s}", customerId);
        logger.error(err);
      }
      else if (!rows.length) {
        logger.error("No user matches Stripe trial ending webhook for {customerId = %s}", customerId);
      }
      else {
        var message = {
          to: rows[0].emailAddress,
          from: {
            email: 'contact@quickmealplanner.com',
            name: 'Quick Meal Planner'
          },
          subject: 'Quick Meal Planner - Free Trial Ending',
          templateId: process.env.SENDGRID_FREE_TRIAL_ENDING_TEMPLATE_ID
        };
  
        sendgrid.send(message, function(err) {
          if (err) {
            logger.error("Unable to send free trial ending email for {customerId = %s, emailAddress = %s}", customerId, rows[0].emailAddress);
            logger.error(err);
          }
        });
      }
    })
  }

  res.sendStatus(200);
});

module.exports = router;