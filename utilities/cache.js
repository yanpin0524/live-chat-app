const Redis = require('redis')
const port = process.env.PORT || 6379
const client = {
  host: process.env.REDIS_URL || '127.0.0.1',
  port: port
}
const redisClient = Redis.createClient(client)
const DEFAULT_EXPIRATION = 3600

module.exports = function getOrSetCache (key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (err, data) => {
      if (err) return reject(err)
      if (data != null) return resolve(JSON.parse(data))
      const freshData = await cb()
      redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
      resolve(freshData)
    })
  })
}
