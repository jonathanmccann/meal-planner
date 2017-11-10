var connection = require('../connection');
var express = require('express');
var router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December"
];

function updateSubscription(subscription, req, res) {
  connection.query('UPDATE User_ SET ? WHERE ?', [{customerId: subscription.customer, subscriptionId: subscription.id, subscriptionStatus: 1}, {userId: req.user.userId}], function(err) {
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
      console.error(err.message);

      req.flash('errorMessage', "Your card has been declined. Please check your card's details and try again.");
      
      break;
    default:
      console.error(err.message);

      req.flash('errorMessage', 'Your subscription request failed to complete. Please contact an administrator.');

      break;
  }
  
  res.redirect('/subscription');
}

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
                plan: "quick-meal-planner"
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
        stripe.subscriptions.update(
          req.user.subscriptionId,
          {
            items: [
              {
                id: subscription.items.data[0].id,
                plan: "quick-meal-planner"
              }
            ]
          }
        ).then(function(subscription) {
          updateSubscription(subscription, req, res);
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
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
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

      var isReceivingDiscount = false;

      if (isPendingCancellation && (subscriptionStatus !== "canceled")) {
        var subscriptionEndDate = new Date(subscription.current_period_end * 1000);

        subscriptionInformation =
          "Your subscription is set to be cancelled on " +
            monthNames[subscriptionEndDate.getMonth()] + " " +
              subscriptionEndDate.getDate() + ", " +
                subscriptionEndDate.getFullYear() +
                  ". After that time you will no longer be able to meal plan, but you will be able to resubscribe if you decide to do so later.";
      }
      else if (subscriptionStatus === "active") {
        var discount = subscription.discount;

        if (discount) {
          isReceivingDiscount = true;

          subscriptionInformation =
            "You are currently on the free forever plan so you will never be charged."
        }
        else {
          var nextChargeDate = new Date(subscription.current_period_end * 1000);

          subscriptionInformation =
            "Your next charge will occur on " +
              monthNames[nextChargeDate.getMonth()] + " " +
                nextChargeDate.getDate() + ", " +
                  nextChargeDate.getFullYear();
        }
      }
      else if (subscriptionStatus === "trialing") {
        var trialEndDate = new Date(subscription.trial_end * 1000);

        subscriptionInformation =
          "Your free trial will end on " +
            monthNames[trialEndDate.getMonth()] + " " +
              trialEndDate.getDate() + ", " +
                trialEndDate.getFullYear() +
                  ". Subscribe soon in order to continue meal planning.";
      }
      else {
        subscriptionInformation =
          "Your subscription has ended. Subscribe now to start meal planning again.";
      }

      res.render('subscription', {
        isReceivingDiscount: isReceivingDiscount,
        errorMessage: req.flash('errorMessage'),
        infoMessage: req.flash('infoMessage'),
        successMessage: req.flash('successMessage'),
        isPendingCancellation: isPendingCancellation,
        isSubscriptionActive: subscription.status === "active",
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
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