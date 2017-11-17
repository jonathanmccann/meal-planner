var async = require('async');
var logger = require('../logger');
var promiseRetry = require('promise-retry');
var rp = require('request-promise');

function addList(accessToken, callback) {
  promiseRetry({retries: 2}, function (retry) {
    return rp({
      url: 'https://a.wunderlist.com/api/v1/lists',
      headers: {
        'X-Access-Token': accessToken,
        'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
      },
      method: 'POST',
      json: {
        'title': 'Grocery List'
      }
    }).catch(retry);
  }).then(function (listData) {
    logger.error("List Data = " + listData);
    logger.error("List ID = " + listData.id);
    return callback(null, listData.id);
  }, function (err) {
    return callback(err);
  });
}

function addTask(accessToken, ingredient, listId, retry) {
  return rp({
    url: 'https://a.wunderlist.com/api/v1/tasks',
    headers: {
      'X-Access-Token': accessToken,
      'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
    },
    method: 'POST',
    json: {
      "list_id": listId,
      "title": ingredient
    }
  }).catch(retry);
}

function addTasks(ingredients, accessToken, listId, callback) {
  var calls = [];

  var failedIngredients = [];

  listId = parseInt(listId);

  for (var ingredient in ingredients) {
    (function (innerIngredient) {
      calls.push(async.reflect(function (callback) {
        promiseRetry({retries: 2}, function (retry) {
          return addTask(accessToken, innerIngredient, listId, retry);
        }).then(function () {
          callback();
        }, function (err) {
          failedIngredients.push(innerIngredient);

          callback(err.error);
        });
      }));
    })(ingredient);
  }

  async.parallel(calls, function(err, results) {
    var hasFailedIngredients = false;

    for (var i = 0; i < results.length; i++) {
      if (results[i].error) {
        logger.error(results[i].error);

        hasFailedIngredients = true; 
      }
    }

    if (err || hasFailedIngredients) {
      callback(err, failedIngredients);
    }
    else {
      callback(null);
    }
  });
}

function getList(accessToken, listId, callback) {
  promiseRetry({retries: 2}, function (retry) {
    return rp({
      url: 'https://a.wunderlist.com/api/v1/lists/' + listId,
      headers: {
        'X-Access-Token': accessToken,
        'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
      },
      method: 'GET'
    }).catch(retry);
  }).then(function () {
    return callback(null);
  }, function (err) {
    return callback(err);
  });
}

module.exports = {
  addList: addList,
  addTasks: addTasks,
	getList: getList
};