var async = require('async');
var promiseRetry = require('promise-retry');
var rp = require('request-promise');
var wunderlistSDK = require('wunderlist');

function addList(accessToken, callback) {
  var wunderlistAPI = getWunderlistAPI(accessToken, callback);

  wunderlistAPI.http.lists.create({
    'title': 'Grocery List'
  }).done(function(listData) {
    return callback(null, listData.id);
  }).fail(function(resp) {
    return callback(resp);
  })
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
        console.log(results[i].error);

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
	var wunderlistAPI = getWunderlistAPI(accessToken, callback);

	wunderlistAPI.http.lists.getID(
    listId
  ).done(function() {
    return callback(null);
  }).fail(function(resp) {
    return callback(resp);
  })
}

function getWunderlistAPI(accessToken, callback) {
	if (accessToken === null) {
		callback("Access token is null");
	}

	return new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': process.env.WUNDERLIST_CLIENT_ID
  });
}

module.exports = {
  addList: addList,
  addTasks: addTasks,
	getList: getList
};