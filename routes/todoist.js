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

function addTasks(ingredients, accessToken, listId, callback) {
  listId = parseInt(listId);

  var ingredientsJson = [];

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
    })(ingredient);
  }

  promiseRetry({retries: 2}, function (retry) {
    return requestPromise({
      url: 'https://todoist.com/api/v7/sync',
      method: 'POST',
      json: {
        "token": accessToken,
        "commands": ingredientsJson
      }
    }).catch(retry);
  }).then(function (todoistResponse) {
    var syncStatus = todoistResponse.sync_status;

    var failedUuids = [];

    for (var key in syncStatus) {
      if (syncStatus[key] !== "ok") {
        console.error("Ingredient failed to sync: " + syncStatus[key]);

        failedUuids.push(key);
      }
    }

    if (failedUuids.length) {
      var failedIngredients = [];

      for (var i = 0; i < ingredientsJson.length; i++) {
        if (failedUuids.includes(ingredientsJson[i].uuid)) {
          failedIngredients.push(ingredientsJson[i].args.content);
        }
      }

      callback(null, failedIngredients);
    }
    else {
      callback();
    }
  }, function (err) {
    callback(err.error);
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
  addTasks: addTasks,
	getList: getList
};