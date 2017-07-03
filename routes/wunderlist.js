var config = require('../config');
var wunderlistSDK = require('wunderlist');
var wunderlistAPI = new wunderlistSDK({
  'accessToken': config.configuration.wunderlistAccessToken,
  'clientID': config.configuration.wunderlistClientId
});

function addList(accessToken, callback) {
  var newWunderlistAPI = new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': config.configuration.wunderlistClientId
  });

  newWunderlistAPI.http.lists.create({
    'title': 'New Grocery List'
  }).done(function(listData) {
    return callback(listData.id);
  }).fail(function(resp) {
    return callback(null, resp);
  })
}

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
  addList: addList,
  addTask: addTask
};