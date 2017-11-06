var request = require('request');

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

function addTask(accessToken, listId, taskTitle, callback) {
  request({
    url: 'https://beta.todoist.com/API/v8/tasks',
    qs: {
      token: accessToken
    },
    method: 'POST',
    json: {
      "content": taskTitle,
      "project_id": parseInt(listId)
    }
  }, function(err, todoistResponse) {
    handleError(
      callback, err, String(todoistResponse.statusCode), todoistResponse.body);
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
  addTask: addTask,
	getList: getList
};