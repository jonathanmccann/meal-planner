var request = require('request');

function addProject(accessToken, callback) {
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

    var projectId = json.id;

    console.log(projectId);

    callback(err, projectId);
  });
}

function addTask(accessToken, projectId, taskTitle, callback) {
  request({
    url: 'https://beta.todoist.com/API/v8/tasks',
    qs: {
      token: accessToken
    },
    method: 'POST',
    form: {
      'content': taskTitle,
      'project_id': projectId
    }
  }, function(err) {
    callback(err);
  });
}

function getProject(accessToken, projectId, callback) {
	request({
    url: 'https://beta.todoist.com/API/v8/projects/' + projectId,
    qs: {
      token: accessToken
    },
    method: 'GET'
  }, function(err) {
    callback(err);
  });
}

module.exports = {
  addProject: addProject,
  addTask: addTask,
	getProject: getProject
};