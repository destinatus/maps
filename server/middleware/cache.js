const redis = require('redis');
const config = require('config');

const cacheTTL = config.get('redis.cacheTTL');

const cacheMiddleware = (req, res, next) => {
  const redisClient = req.app.locals.redis;
  const key = req.originalUrl;

  redisClient.get(key)
    .then(data => {
      if (data) {
        return res.json(JSON.parse(data));
      }
      next();
    })
    .catch(err => {
      console.error('Cache error:', err);
      next();
    });
};

const setCache = (req, data) => {
  const redisClient = req.app.locals.redis;
  const key = req.originalUrl;
  
  redisClient.setEx(key, cacheTTL, JSON.stringify(data))
    .catch(err => console.error('Cache set error:', err));
};

module.exports = {
  cacheMiddleware,
  setCache
};
