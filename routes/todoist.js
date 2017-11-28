var async = require('async');
var logger = require('../logger');
var promiseRetry = require('promise-retry');
var requestPromise = require('request-promise');
var request = require('request');
var uuidv1 = require('uuid/v1');

function addList(accessToken, callback) {
  request({
    url: 'https://beta.todoist.com/API/v8/projects',
    qs: {
      token: accessToken
    },
    method: 'POST',
    form: {
      'name': 'Grocery List'
    }
  }, function(err, todoistResponse) {
    var json = JSON.parse(todoistResponse.body);

    var listId = json.id;

    handleError(
      callback, err, String(todoistResponse.statusCode), todoistResponse.body,
      listId);
  });
}

function distributeTasks(ingredients, accessToken, listId, callback) {
  var calls = [];

  var ingredientsJson = [];

  var ingredientsLength = Object.keys(ingredients).length;

  for (var ingredient in ingredients) {
    (function (innerIngredient) {
      ingredientsJson.push({
        type: "item_add",
        temp_id: uuidv1(),
        uuid: uuidv1(),
        args: {
          content: innerIngredient,
          project_id: listId
        }
      });

      if ((ingredientsJson.length % 100 === 0) || (ingredientsJson.length === ingredientsLength)) {
        var temporaryIngredientsJson = ingredientsJson;

        calls.push(async.reflect(function (callback) {
          addTasks(temporaryIngredientsJson, accessToken, callback);
        }));

        ingredientsJson = [];

        ingredientsLength -= 100;
      }
    })(ingredient);
  }

  async.series(calls, function(err, results) {
    if (err) {
      return callback(err);
    }
    else {
      var failedIngredients = [];

      for (var i = 0; i < results.length; i++) {
        if (results[i].error) {
          logger.error("An error occurred while adding an ingredient to Todoist");
          logger.error(results[i].error);
        }
        else if (results[i].value) {
          failedIngredients.push(results[i].value);
        }
      }

      callback(null, failedIngredients);
    }
  });
}

function addTasks(ingredients, accessToken, callback) {
  promiseRetry({retries: 2}, function (retry) {
    return requestPromise({
      url: 'https://todoist.com/api/v7/sync',
      method: 'POST',
      json: {
        "token": accessToken,
        "commands": ingredients
      }
    }).catch(retry);
  }).then(function (todoistResponse) {
    var syncStatus = todoistResponse.sync_status;

    var failedUuids = [];

    for (var key in syncStatus) {
      if (syncStatus[key] !== "ok") {
        logger.error("Ingredient failed to sync");
        logger.error(syncStatus[key]);

        failedUuids.push(key);
      }
    }

    if (failedUuids.length) {
      var failedIngredients = [];

      for (var i = 0; i < ingredients.length; i++) {
        if (failedUuids.includes(ingredients[i].uuid)) {
          failedIngredients.push(ingredients[i].args.content);
        }
      }

      callback(null, failedIngredients);
    }
    else {
      callback();
    }
  }, function (err) {
    callback(err);
  });
}

function getList(accessToken, listId, callback) {
	request({
    url: 'https://beta.todoist.com/API/v8/projects/' + listId,
    qs: {
      token: accessToken
    },
    method: 'GET'
  }, function(err, todoistResponse) {
    handleError(
      callback, err, String(todoistResponse.statusCode), todoistResponse.body);
  });
}

function handleError(callback, err, statusCode, body, listId) {
  if (err) {
    callback(err, listId);
  }
  else if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
    callback(body, listId);
  }
  else {
    callback(err, listId);
  }
}

module.exports = {
  addList: addList,
  addTasks: distributeTasks,
	getList: getList
};