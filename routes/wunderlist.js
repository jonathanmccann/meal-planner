var config = require('../config');
var wunderlistSDK = require('wunderlist');
var wunderlistAPI = new wunderlistSDK({
  'accessToken': config.configuration.wunderlistAccessToken,
  'clientID': config.configuration.wunderlistClientId
});

function addTask(taskTitle) {
  wunderlistAPI.http.tasks.create({
    'list_id': config.configuration.listId,
    'title': taskTitle
  }).fail(function (resp) {
    console.error("An error occurred while adding tasks: " + resp);
  });
}

module.exports = {
  addTask: addTask
};