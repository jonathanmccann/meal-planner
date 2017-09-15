var config = require('../config');
var wunderlistSDK = require('wunderlist');

function addList(accessToken, callback) {
  var wunderlistAPI = getWunderlistAPI(accessToken);

  wunderlistAPI.http.lists.create({
    'title': 'Grocery List'
  }).done(function(listData) {
    return callback(listData.id);
  }).fail(function(resp) {
    return callback(null, resp);
  })
}

function addTask(accessToken, listId, taskTitle, callback) {
  var wunderlistAPI = getWunderlistAPI(accessToken);

  wunderlistAPI.http.tasks.create({
    'list_id': parseInt(listId),
    'title': taskTitle
  }).done(function () {
    return callback(null);
  }).fail(function (resp) {
    return callback(resp);
  });
}

function getList(accessToken, listId, callback) {
	var wunderlistAPI = getWunderlistAPI(accessToken);

	wunderlistAPI.http.lists.getID(
    listId
  ).done(function() {
    return callback(null);
  }).fail(function(resp) {
    return callback(resp);
  })
}

function getWunderlistAPI(accessToken) {
	return new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': config.configuration.wunderlistClientId
  });
}

module.exports = {
  addList: addList,
  addTask: addTask,
	getList: getList
};