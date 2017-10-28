var wunderlistSDK = require('wunderlist');

function addList(accessToken, callback) {
  var wunderlistAPI = getWunderlistAPI(accessToken, callback);

  wunderlistAPI.http.lists.create({
    'title': 'Grocery List'
  }).done(function(listData) {
    return callback(null, listData.id);
  }).fail(function(resp) {
    return callback(resp);
  })
}

function addTask(accessToken, listId, taskTitle, callback) {
  var wunderlistAPI = getWunderlistAPI(accessToken, callback);

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
	var wunderlistAPI = getWunderlistAPI(accessToken, callback);

	wunderlistAPI.http.lists.getID(
    listId
  ).done(function() {
    return callback(null);
  }).fail(function(resp) {
    return callback(resp);
  })
}

function getWunderlistAPI(accessToken, callback) {
	if (accessToken === null) {
		callback("Access token is null");
	}

	return new wunderlistSDK({
    'accessToken': accessToken,
    'clientID': process.env.WUNDERLIST_CLIENT_ID
  });
}

module.exports = {
  addList: addList,
  addTask: addTask,
	getList: getList
};