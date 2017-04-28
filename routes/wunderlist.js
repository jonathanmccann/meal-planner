var config = require('../config');
var wunderlistSDK = require('wunderlist');
var wunderlistAPI = new wunderlistSDK({
  'accessToken': config.configuration.wunderlistAccessToken,
  'clientID': config.configuration.wunderlistClientId
});

function addTask(taskTitle, callback) {
  wunderlistAPI.http.tasks.create({
    'list_id': config.configuration.listId,
    'title': taskTitle
  }).done(function () {
    return callback(null);
  }).fail(function (resp) {
    return callback(resp);
  });
}

module.exports = {
  addTask: addTask
};