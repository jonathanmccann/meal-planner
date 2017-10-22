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

    callback(err, listId);
  });
}

function addTask(accessToken, listId, taskTitle, callback) {
  request({
    url: 'https://beta.todoist.com/API/v8/tasks',
    qs: {
      token: accessToken
    },
    method: 'POST',
    form: {
      'content': taskTitle,
      'project_id': listId
    }
  }, function(err) {
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
  }, function(err) {
    callback(err);
  });
}

module.exports = {
  addList: addList,
  addTask: addTask,
	getList: getList
};