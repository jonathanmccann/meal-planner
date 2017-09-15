var config = require('../config');
var wunderlistSDK = require('wunderlist');

function addList(accessToken, callback) {
  var newWunderlistAPI = new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': config.configuration.wunderlistClientId
  });

  newWunderlistAPI.http.lists.create({
    'title': 'Grocery List'
  }).done(function(listData) {
    return callback(listData.id);
  }).fail(function(resp) {
    return callback(null, resp);
  })
}

function addTask(accessToken, listId, taskTitle, callback) {
  var wunderlistAPI = new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': config.configuration.wunderlistClientId
  });

  wunderlistAPI.http.tasks.create({
    'list_id': parseInt(listId),
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