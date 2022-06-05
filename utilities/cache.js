const Redis = require('redis')
const redisClient = Redis.createClient()
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
