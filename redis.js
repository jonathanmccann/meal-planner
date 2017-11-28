var redis = require('redis');
var expressBruteRedis = require('express-brute-redis');

var redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST
);

redisClient.auth(process.env.REDIS_PASSWORD);

var expressBruteRedisStore = new expressBruteRedis({
  client: redisClient
});

module.exports = {
  redisClient: redisClient,
  expressBruteRedisStore: expressBruteRedisStore
};