var config = require('../config');
var connection = require('../connection');
var express = require('express');
var router = express.Router();

const stripe = require('stripe')(config.configuration.stripeSecretKey);

const monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December"
];

function addSubscription(subscription, req, res) {
  connection.query('UPDATE User_ SET ? WHERE ?', [{customerId: subscription.customer, subscriptionId: subscription.id, isSubscribed: 1}, {userId: req.user.userId}], function(err) {
    if (err) {
      console.error(err);

      req.flash('errorMessage', 'Your subscription request failed to complete. Please contact an administrator.');

      res.redirect('/subscription');
    }
    else {
      req.flash('successMessage', 'Thank you for subscribing! Please enjoy all of the features of the site.');

      res.redirect('/subscription');
    }
  });
}

function handleStripeError(err, req, res) {
  switch (err.type) {
    case 'StripeCardError':
      console.log(err.message);

      req.flash('errorMessage', "Your card has been declined. Please check your card's details and try again.");
      
      break;
    default:
      console.log(err.message);

      req.flash('errorMessage', 'Your subscription request failed to complete. Please contact an administrator.');

      break;
  }
  
  res.redirect('/subscription');
}

router.post('/add-subscription', function(req, res) {
  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken
  }).then(function(customer) {
    return stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          plan: "meal-planner"
        }
      ]
    })
  }).then(function(subscription) {
    addSubscription(subscription, req, res);
  }).catch(function(err) {
    handleStripeError(err, req, res);
  });
});

router.post('/cancel-subscription', function(req, res) {
  stripe.subscriptions.del(
    req.user.subscriptionId,
    {
      at_period_end: true
    }
  ).then(function() {
    req.flash('successMessage', 'You subscription has been set to end at the end of the current billing cycle. Please utilize this time to save your recipes to another location.');
  
    res.redirect('/subscription');
  }).catch(function(err) {
    handleStripeError(err);
  });
});

router.post('/update-card', function(req, res) {
  stripe.customers.update(
    req.user.customerId,
    {
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    }
  ).then(function() {
    req.flash('successMessage', 'You have successfully updated your credit card details.');

    res.redirect('/subscription');
  }).catch(function(err) {
    handleStripeError(err);
  });
});

router.post('/update-subscription', function(req, res) {
  stripe.subscriptions.retrieve(
    req.user.subscriptionId
  ).then(function(subscription) {
    if ((subscription.status === "trialing") || (subscription.cancel_at_period_end)) {
      stripe.customers.update(
        req.user.customerId,
        {
          email: req.body.stripeEmail,
          source: req.body.stripeToken
        }
      ).then(function() {
        stripe.subscriptions.update(
          req.user.subscriptionId,
          {
            trial_end: "now",
            items: [
              {
                id: subscription.items.data[0].id,
                plan: "meal-planner"
              }
            ]
          }
        ).then(function() {
          req.flash('successMessage', 'You have successfully resubscribed! Please continue enjoying all of the features of the site.');

          res.redirect('/subscription');
        }).catch(function(err) {
          handleStripeError(err);
        });
      }).catch(function(err) {
        handleStripeError(err);
      });
    }
    else {
      stripe.customers.update(
        req.user.customerId,
        {
          email: req.body.stripeEmail,
          source: req.body.stripeToken
        }
      ).then(function() {
        stripe.subscriptions.create({
          customer: req.user.customerId,
          items: [
            {
              plan: "meal-planner"
            }
          ]
        }).then(function(subscription) {
          addSubscription(subscription, req, res);
        }).catch(function(err) {
          handleStripeError(err, req, res);
        });
      }).catch(function(err) {
        handleStripeError(err);
      });
    }
  }).catch(function(err) {
    handleStripeError(err);
  });
});

router.get('/subscription', function(req, res) {
  if ((req.user.customerId === null) || (req.user.subscriptionId === null)) {
    var subscriptionInformation =
      "Your subscription has ended. Subscribe now to continue using this site.";

    res.render('subscription', {
      errorMessage: req.flash('errorMessage'),
      infoMessage: req.flash('infoMessage'),
      successMessage: req.flash('successMessage'),
      isSubscriptionActive: false,
      publishableKey: config.configuration.stripePublishableKey,
      subscriptionInformation: subscriptionInformation,
      title: "Subscription",
      user: req.user
    });
  }
  else {
    stripe.subscriptions.retrieve(
      req.user.subscriptionId
    ).then(function(subscription) {
      var subscriptionInformation;

      var isPendingCancellation = subscription.cancel_at_period_end;
      var subscriptionStatus = subscription.status;

      if (isPendingCancellation) {
        var subscriptionEndDate = new Date(subscription.current_period_end * 1000);

        subscriptionInformation =
          "Your subscription is set to be cancelled on " +
            monthNames[subscriptionEndDate.getMonth()] + " " +
              subscriptionEndDate.getDate() + ", " +
                subscriptionEndDate.getFullYear() +
                  ". After that time, you will no longer have access to this website, but can still resubscribe if you decide to do so later.";
      }
      else if (subscriptionStatus === "active") {
        var nextChargeDate = new Date(subscription.current_period_end * 1000);

        subscriptionInformation =
          "Your next charge will occur on " +
            monthNames[nextChargeDate.getMonth()] + " " +
              nextChargeDate.getDate() + ", " +
                nextChargeDate.getFullYear();
      }
      else if (subscriptionStatus === "trialing") {
        var trialEndDate = new Date(subscription.trial_end * 1000);

        subscriptionInformation =
          "Your free trial will end on " +
            monthNames[trialEndDate.getMonth()] + " " +
              trialEndDate.getDate() + ", " +
                trialEndDate.getFullYear() +
                  ". Be sure to subscribe soon in order to continue using this site.";
      }
      else {
        subscriptionInformation =
          "Your subscription has ended. Subscribe now to continue using this site.";
      }

      res.render('subscription', {
        errorMessage: req.flash('errorMessage'),
        infoMessage: req.flash('infoMessage'),
        successMessage: req.flash('successMessage'),
        isPendingCancellation: isPendingCancellation,
        isSubscriptionActive: subscription.status === "active",
        publishableKey: config.configuration.stripePublishableKey,
        subscriptionInformation: subscriptionInformation,
        title: "Subscription",
        user: req.user
      });
    }).catch(function(err) {
      handleStripeError(err);
    });
  }
});

module.exports = router;